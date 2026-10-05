import asyncio
import asyncpg

async def main():
    conn = await asyncpg.connect(user='postgres', database='postgres', host='127.0.0.1')
    await conn.execute("ALTER USER postgres WITH PASSWORD 'admin123';")
    await conn.close()
    print("Password updated successfully!")

asyncio.run(main())