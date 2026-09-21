from . import usuarios, auth, productos, inventario, movimientos_inventario
from . import cotizaciones, detalle_cotizaciones, billing, auditoria
from . import reservas                    

all_routers = [
    usuarios.router,
    auth.router,
    productos.router,
    inventario.router,
    movimientos_inventario.router,
    cotizaciones.router,
    detalle_cotizaciones.router,
    billing.router,
    auditoria.router,
    reservas.router,                      
]