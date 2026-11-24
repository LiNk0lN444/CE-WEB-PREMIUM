"""
Reportes de ventas — SOLO administradores.

Definición de "venta": cotización cuyo estado es approved, active o completed
(o sea, ya fue aprobada por un admin). Se cuenta en el mes en que fue APROBADA
(approved_at; si no existiera, se usa date_created). Pendientes, rechazadas y
canceladas no suman.

Montos:
  total    = cotizaciones.total_price  (IVA incluido)
  iva      = cotizaciones.iva
  subtotal = total - iva
  por producto = SUM(cantidad * precio del detalle)  (precio ya incluye los meses, sin IVA)
"""
import calendar
import io
from collections import defaultdict
from datetime import date, datetime
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import Response
from sqlalchemy import text
from sqlalchemy.orm import Session

from config.database import get_db
from model.dependencies import require_admin

router = APIRouter(
    prefix="/admin/reportes",
    tags=["Admin - Reportes"],
    dependencies=[Depends(require_admin)],
)

ESTADOS_VENTA = ("approved", "active", "completed")
MESES = ["", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio",
         "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"]
ESTADO_LABEL = {"approved": "Aprobada", "active": "En curso", "completed": "Finalizada"}


# ============================================================
# Cálculo del reporte
# ============================================================
def _rango_mes(year: int, month: int):
    desde = datetime(year, month, 1)
    hasta = datetime(year + 1, 1, 1) if month == 12 else datetime(year, month + 1, 1)
    return desde, hasta


def _total_mes(db: Session, year: int, month: int) -> float:
    desde, hasta = _rango_mes(year, month)
    fila = db.execute(
        text("""
            SELECT COALESCE(SUM(c.total_price), 0) AS total
            FROM cotizaciones c
            WHERE c.status IN ('approved', 'active', 'completed')
              AND COALESCE(c.approved_at, c.date_created) >= :desde
              AND COALESCE(c.approved_at, c.date_created) <  :hasta
        """),
        {"desde": desde, "hasta": hasta},
    ).fetchone()
    return float(fila.total or 0)


def construir_reporte(db: Session, year: int, month: int) -> dict:
    desde, hasta = _rango_mes(year, month)
    params = {"desde": desde, "hasta": hasta}

    filas = db.execute(
        text("""
            SELECT c.cotizacion_id, c.user_id, u.username, u.email,
                   COALESCE(c.approved_at, c.date_created) AS fecha_venta,
                   c.start_date, c.end_date, c.total_price, c.iva, c.status,
                   adm.username AS aprobado_por
            FROM cotizaciones c
            INNER JOIN users u ON u.user_id = c.user_id
            LEFT JOIN users adm ON adm.user_id = c.approved_by
            WHERE c.status IN ('approved', 'active', 'completed')
              AND COALESCE(c.approved_at, c.date_created) >= :desde
              AND COALESCE(c.approved_at, c.date_created) <  :hasta
            ORDER BY fecha_venta ASC, c.cotizacion_id ASC
        """),
        params,
    ).fetchall()

    productos = db.execute(
        text("""
            SELECT p.product_id, p.name,
                   SUM(dc.quantity) AS unidades,
                   SUM(dc.quantity * dc.price) AS ingresos
            FROM detalle_cotizaciones dc
            INNER JOIN cotizaciones c ON c.cotizacion_id = dc.cotizacion_id
            INNER JOIN products p ON p.product_id = dc.product_id
            WHERE c.status IN ('approved', 'active', 'completed')
              AND COALESCE(c.approved_at, c.date_created) >= :desde
              AND COALESCE(c.approved_at, c.date_created) <  :hasta
            GROUP BY p.product_id, p.name
            ORDER BY ingresos DESC, p.name ASC
        """),
        params,
    ).fetchall()

    ventas = []
    por_dia_acum = defaultdict(lambda: {"num_ventas": 0, "total": 0.0})
    clientes = set()
    total = 0.0
    iva = 0.0

    for f in filas:
        t = float(f.total_price or 0)
        i = float(f.iva or 0)
        total += t
        iva += i
        clientes.add(f.user_id)
        dia = f.fecha_venta.date()
        por_dia_acum[dia]["num_ventas"] += 1
        por_dia_acum[dia]["total"] += t
        ventas.append({
            "cotizacion_id": f.cotizacion_id,
            "cliente": f.username,
            "email": f.email,
            "fecha_venta": f.fecha_venta.isoformat(),
            "start_date": f.start_date.isoformat() if f.start_date else None,
            "end_date": f.end_date.isoformat() if f.end_date else None,
            "subtotal": round(t - i, 2),
            "iva": round(i, 2),
            "total": round(t, 2),
            "status": f.status,
            "aprobado_por": f.aprobado_por,
        })

    # Todos los días del mes (con ceros) para graficar
    ultimo_dia = calendar.monthrange(year, month)[1]
    por_dia = []
    for d in range(1, ultimo_dia + 1):
        fecha = date(year, month, d)
        acum = por_dia_acum.get(fecha, {"num_ventas": 0, "total": 0.0})
        por_dia.append({
            "fecha": fecha.isoformat(),
            "dia": d,
            "num_ventas": acum["num_ventas"],
            "total": round(acum["total"], 2),
        })

    # Comparativo con el mes anterior
    anio_prev, mes_prev = (year - 1, 12) if month == 1 else (year, month - 1)
    total_prev = _total_mes(db, anio_prev, mes_prev)
    variacion = round((total - total_prev) / total_prev * 100, 1) if total_prev > 0 else None

    num_ventas = len(ventas)
    return {
        "periodo": {
            "year": year,
            "month": month,
            "label": f"{MESES[month]} {year}",
            "desde": desde.date().isoformat(),
            "hasta": date(year, month, ultimo_dia).isoformat(),
        },
        "resumen": {
            "num_ventas": num_ventas,
            "total_ventas": round(total, 2),
            "subtotal": round(total - iva, 2),
            "iva": round(iva, 2),
            "ticket_promedio": round(total / num_ventas, 2) if num_ventas else 0,
            "clientes_unicos": len(clientes),
            "total_mes_anterior": round(total_prev, 2),
            "variacion_pct": variacion,
        },
        "por_producto": [
            {
                "product_id": p.product_id,
                "nombre": p.name,
                "unidades": int(p.unidades or 0),
                "ingresos": round(float(p.ingresos or 0), 2),
            }
            for p in productos
        ],
        "por_dia": por_dia,
        "ventas": ventas,
    }


def _validar_periodo(year: int, month: int):
    if not (1 <= month <= 12):
        raise HTTPException(status_code=400, detail="El mes debe estar entre 1 y 12.")
    if not (2000 <= year <= 2100):
        raise HTTPException(status_code=400, detail="Año fuera de rango.")


# ============================================================
# Endpoints
# ============================================================
@router.get("/ventas-mensuales")
def reporte_ventas_mensuales(
    year: int = Query(default_factory=lambda: date.today().year),
    month: int = Query(default_factory=lambda: date.today().month),
    db: Session = Depends(get_db),
):
    _validar_periodo(year, month)
    return construir_reporte(db, year, month)


@router.get("/ventas-mensuales/export")
def exportar_ventas_mensuales(
    formato: Literal["xlsx", "pdf"] = "xlsx",
    year: int = Query(default_factory=lambda: date.today().year),
    month: int = Query(default_factory=lambda: date.today().month),
    db: Session = Depends(get_db),
):
    _validar_periodo(year, month)
    reporte = construir_reporte(db, year, month)
    nombre = f"reporte_ventas_{year}-{month:02d}.{formato}"

    if formato == "xlsx":
        contenido = _generar_excel(reporte)
        media = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    else:
        contenido = _generar_pdf(reporte)
        media = "application/pdf"

    return Response(
        content=contenido,
        media_type=media,
        headers={"Content-Disposition": f'attachment; filename="{nombre}"'},
    )


# ============================================================
# Exportar a Excel
# ============================================================
def _generar_excel(r: dict) -> bytes:
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Font, PatternFill
    from openpyxl.utils import get_column_letter

    wb = Workbook()
    rojo = PatternFill("solid", fgColor="B21420")
    cab_font = Font(bold=True, color="FFFFFF")
    moneda = '"$"#,##0'

    def encabezado(ws, fila, titulos):
        for col, t in enumerate(titulos, start=1):
            c = ws.cell(row=fila, column=col, value=t)
            c.fill, c.font = rojo, cab_font
            c.alignment = Alignment(horizontal="center", vertical="center")

    def autoajustar(ws):
        for col in ws.columns:
            largo = max((len(str(c.value)) for c in col if c.value is not None), default=8)
            ws.column_dimensions[get_column_letter(col[0].column)].width = min(max(largo + 3, 12), 45)

    res = r["resumen"]

    # --- Hoja Resumen ---
    ws = wb.active
    ws.title = "Resumen"
    ws["A1"] = f"Reporte de ventas — {r['periodo']['label']}"
    ws["A1"].font = Font(bold=True, size=14)
    ws["A2"] = f"Generado: {datetime.now():%Y-%m-%d %H:%M}"
    filas = [
        ("Número de ventas", res["num_ventas"], None),
        ("Subtotal (sin IVA)", res["subtotal"], moneda),
        ("IVA", res["iva"], moneda),
        ("Total ventas (con IVA)", res["total_ventas"], moneda),
        ("Ticket promedio", res["ticket_promedio"], moneda),
        ("Clientes distintos", res["clientes_unicos"], None),
        ("Total mes anterior", res["total_mes_anterior"], moneda),
        ("Variación vs mes anterior (%)",
         res["variacion_pct"] if res["variacion_pct"] is not None else "N/A", None),
    ]
    for i, (k, v, fmt) in enumerate(filas, start=4):
        ws.cell(row=i, column=1, value=k).font = Font(bold=True)
        c = ws.cell(row=i, column=2, value=v)
        if fmt:
            c.number_format = fmt
    autoajustar(ws)

    # --- Hoja Ventas ---
    ws = wb.create_sheet("Ventas")
    encabezado(ws, 1, ["Cotización", "Cliente", "Correo", "Fecha de venta", "Inicio", "Fin",
                       "Subtotal", "IVA", "Total", "Estado", "Aprobada por"])
    for i, v in enumerate(r["ventas"], start=2):
        ws.cell(row=i, column=1, value=f"COT-{v['cotizacion_id']}")
        ws.cell(row=i, column=2, value=v["cliente"])
        ws.cell(row=i, column=3, value=v["email"])
        ws.cell(row=i, column=4, value=v["fecha_venta"][:10])
        ws.cell(row=i, column=5, value=v["start_date"])
        ws.cell(row=i, column=6, value=v["end_date"])
        for col, key in ((7, "subtotal"), (8, "iva"), (9, "total")):
            ws.cell(row=i, column=col, value=v[key]).number_format = moneda
        ws.cell(row=i, column=10, value=ESTADO_LABEL.get(v["status"], v["status"]))
        ws.cell(row=i, column=11, value=v["aprobado_por"])
    fin = len(r["ventas"]) + 2
    ws.cell(row=fin, column=6, value="TOTAL").font = Font(bold=True)
    for col in (7, 8, 9):
        letra = get_column_letter(col)
        c = ws.cell(row=fin, column=col, value=f"=SUM({letra}2:{letra}{fin - 1})" if r["ventas"] else 0)
        c.number_format, c.font = moneda, Font(bold=True)
    ws.freeze_panes = "A2"
    autoajustar(ws)

    # --- Hoja Por producto ---
    ws = wb.create_sheet("Por producto")
    encabezado(ws, 1, ["Producto", "Unidades", "Ingresos (sin IVA)"])
    for i, p in enumerate(r["por_producto"], start=2):
        ws.cell(row=i, column=1, value=p["nombre"])
        ws.cell(row=i, column=2, value=p["unidades"])
        ws.cell(row=i, column=3, value=p["ingresos"]).number_format = moneda
    ws.freeze_panes = "A2"
    autoajustar(ws)

    # --- Hoja Por día ---
    ws = wb.create_sheet("Por día")
    encabezado(ws, 1, ["Fecha", "Ventas", "Total"])
    for i, d in enumerate(r["por_dia"], start=2):
        ws.cell(row=i, column=1, value=d["fecha"])
        ws.cell(row=i, column=2, value=d["num_ventas"])
        ws.cell(row=i, column=3, value=d["total"]).number_format = moneda
    ws.freeze_panes = "A2"
    autoajustar(ws)

    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


# ============================================================
# Exportar a PDF
# ============================================================
def _cop(v) -> str:
    return "$" + f"{float(v or 0):,.0f}".replace(",", ".")


def _generar_pdf(r: dict) -> bytes:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import cm
    from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=landscape(A4),
        leftMargin=1.5 * cm, rightMargin=1.5 * cm, topMargin=1.5 * cm, bottomMargin=1.5 * cm,
        title=f"Reporte de ventas {r['periodo']['label']}",
    )
    estilos = getSampleStyleSheet()
    titulo = ParagraphStyle("t", parent=estilos["Title"], textColor=colors.HexColor("#B21420"))
    h2 = ParagraphStyle("h2", parent=estilos["Heading2"], spaceBefore=14)
    chico = ParagraphStyle("c", parent=estilos["Normal"], fontSize=8, textColor=colors.grey)
    celda = ParagraphStyle("celda", parent=estilos["Normal"], fontSize=8, leading=10)

    def tabla(datos, anchos=None, derecha=()):
        t = Table(datos, colWidths=anchos, repeatRows=1)
        est = [
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#B21420")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#F4F4F5")]),
            ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#D4D4D8")),
            ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ]
        for col in derecha:
            est.append(("ALIGN", (col, 0), (col, -1), "RIGHT"))
        t.setStyle(TableStyle(est))
        return t

    res = r["resumen"]
    variacion = "N/A" if res["variacion_pct"] is None else f"{res['variacion_pct']:+.1f}%"

    el = [
        Paragraph("CE-Web — Reporte de ventas", titulo),
        Paragraph(f"<b>{r['periodo']['label']}</b> &nbsp;·&nbsp; {r['periodo']['desde']} a {r['periodo']['hasta']}",
                  estilos["Normal"]),
        Paragraph(f"Generado el {datetime.now():%Y-%m-%d %H:%M}", chico),
        Spacer(1, 10),
        tabla([
            ["Ventas", "Subtotal", "IVA", "Total", "Ticket promedio", "Clientes", "Vs. mes anterior"],
            [res["num_ventas"], _cop(res["subtotal"]), _cop(res["iva"]), _cop(res["total_ventas"]),
             _cop(res["ticket_promedio"]), res["clientes_unicos"], variacion],
        ]),
        Paragraph("Detalle de ventas", h2),
    ]

    if r["ventas"]:
        datos = [["Cotización", "Cliente", "Fecha venta", "Inicio", "Fin", "Subtotal", "IVA", "Total", "Estado"]]
        for v in r["ventas"]:
            datos.append([
                f"COT-{v['cotizacion_id']}",
                Paragraph(v["cliente"] or "", celda),
                v["fecha_venta"][:10], v["start_date"] or "—", v["end_date"] or "—",
                _cop(v["subtotal"]), _cop(v["iva"]), _cop(v["total"]),
                ESTADO_LABEL.get(v["status"], v["status"]),
            ])
        datos.append(["", "", "", "", "TOTAL", _cop(res["subtotal"]), _cop(res["iva"]), _cop(res["total_ventas"]), ""])
        t = tabla(datos, anchos=[2.2*cm, 5.2*cm, 2.4*cm, 2.4*cm, 2.4*cm, 3*cm, 2.6*cm, 3*cm, 2.4*cm],
                  derecha=(5, 6, 7))
        t.setStyle(TableStyle([("FONTNAME", (0, -1), (-1, -1), "Helvetica-Bold")]))
        el.append(t)
    else:
        el.append(Paragraph("No hubo ventas aprobadas en este mes.", estilos["Normal"]))

    if r["por_producto"]:
        el.append(Paragraph("Ventas por producto", h2))
        datos = [["Producto", "Unidades", "Ingresos (sin IVA)"]]
        for p in r["por_producto"]:
            datos.append([Paragraph(p["nombre"], celda), p["unidades"], _cop(p["ingresos"])])
        el.append(tabla(datos, anchos=[11*cm, 3*cm, 5*cm], derecha=(1, 2)))

    el.append(Spacer(1, 8))
    el.append(Paragraph(
        "Se consideran ventas las cotizaciones aprobadas, en curso o finalizadas, contadas en el mes de su aprobación.",
        chico))
    doc.build(el)
    return buf.getvalue()
