import psycopg


class UserConnection:
    """
    Nota: esta clase no la usa ningún router actualmente (la conexión real
    la maneja SQLAlchemy en config/database.py). Se deja corregida por si
    se necesita una conexión directa con psycopg en el futuro.
    """

    def __init__(self):
        self.conn = None
        try:
            self.conn = psycopg.connect(
                "dbname=ce_web user=licoln password=777 port=5432 host=localhost"
            )
        except psycopg.OperationalError as err:
            print(err)
            # Si falló la conexión, self.conn queda en None

    def write(self, data):
        with self.conn.cursor() as cur:
            cur.execute(
                "INSERT INTO users (name, email) VALUES (%(name)s, %(email)s)", data
            )
            self.conn.commit()

    def __del__(self):
        if self.conn is not None:
            self.conn.close()