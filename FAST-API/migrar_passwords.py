# FAST-API/migrar_passwords.py
from config.database import SessionLocal
from model import models
from model.security import hash_password

db = SessionLocal()

# 👇 Ajusta con las contraseñas reales (las que estaban en texto plano)
usuarios_a_migrar = [
    ("david.perez@example.com", "hashed_pass_123"),
    ("ana.gomez@example.com",  "hashed_pass_456"),
    ("lau@gmail.com",          "1234"),   # 👈 la que le pusiste a Laura
]

for email, password_plano in usuarios_a_migrar:
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        print(f"❌ {email} no encontrado")
        continue

    # Si ya está hasheado, saltar
    if user.password.startswith("$2b$"):
        print(f"⏭️  {email} ya estaba hasheado")
        continue

    user.password = hash_password(password_plano)
    print(f"✅ {email} migrado")

db.commit()
db.close()
print("\n🎉 Migración completada")