# migrar_passwords.py
from config.database import SessionLocal
from model import models
from model.security import hash_password

db = SessionLocal()

print("🔐 Migrando contraseñas de texto plano a bcrypt...\n")

usuarios = db.query(models.User).all()
migrados = 0
saltados = 0

for user in usuarios:
    # Si ya está hasheado (empieza con $2b$), saltar
    if user.password.startswith("$2b$"):
        print(f"⏭️  Ya hasheado: {user.email}")
        saltados += 1
        continue

    # Hashear la contraseña actual (tal cual está en texto plano)
    password_original = user.password
    user.password = hash_password(password_original)

    print(f"✅ Migrado: {user.email}  →  (contraseña actual: '{password_original}')")
    migrados += 1

db.commit()
db.close()

print(f"\n{'='*50}")
print(f"📊 Migrados: {migrados} | Saltados: {saltados}")
print(f"{'='*50}")
print("🎉 Ahora todos pueden loguearse con la MISMA contraseña que ya tenían.")