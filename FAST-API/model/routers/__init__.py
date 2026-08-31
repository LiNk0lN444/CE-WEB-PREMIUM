from . import (
    roles,
    usuarios,
    clientes,
    maquinaria,
    categorias,
    herramientas,
    auditoria,
    cotizaciones,
    detalle_cotizacion,
    reportes,
    notificaciones,
)

all_routers = [
    roles.router,
    usuarios.router,
    clientes.router,
    maquinaria.router,
    categorias.router,
    herramientas.router,
    auditoria.router,
    cotizaciones.router,
    detalle_cotizacion.router,
    reportes.router,
    notificaciones.router,
]