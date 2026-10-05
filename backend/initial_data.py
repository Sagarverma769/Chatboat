import asyncio
from sqlalchemy.future import select

from db.session import AsyncSessionLocal
from core.security import get_password_hash
from models.user import User


async def create_first_superuser() -> None:
    async with AsyncSessionLocal() as db:
        admin_email = "admin@example.com"
        
        result = await db.execute(select(User).where(User.email == admin_email))
        user = result.scalars().first()
        
        if not user:
            admin_user = User(
                email=admin_email,
                hashed_password=get_password_hash("AdminPassword123!"),
                full_name="System Administrator",
                is_active=True,
                is_superuser=True,
                is_verified=True,
            )
            db.add(admin_user)
            await db.commit()
            print(f"Superuser '{admin_email}' created successfully!")
        else:
            print(f"Superuser '{admin_email}' already exists.")


if __name__ == "__main__":
    print("Seeding initial data into database...")
    asyncio.run(create_first_superuser())
