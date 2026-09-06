from . import (
    usuarios,
    productos,
    inventario,
    movimientos_inventario,
    cotizaciones,
    detalle_cotizaciones,
    billing,
    auditoria,
)

all_routers = [
    usuarios.router,
    productos.router,
    inventario.router,
    movimientos_inventario.router,
    cotizaciones.router,
    detalle_cotizaciones.router,
    billing.router,
    auditoria.router,
]