from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Annotated, Any
from uuid import UUID, uuid4
import secrets

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security.oauth2 import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import ValidationError
from sqlmodel import SQLModel, Field, func, select, create_engine, Session
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher
from pwdlib.hashers.bcrypt import BcryptHasher
import jwt


# ---------------------------------------------
# Db
# ---------------------------------------------

engine = create_engine("sqlite:///database.db")

def session_yield():
    with Session(engine) as ses:
        yield ses

SessionDep = Annotated[Session, Depends(session_yield)]

# ---------------------------------------------
# Models
# ---------------------------------------------

def timeutc_factory():
    return datetime.now(timezone.utc)

class User(SQLModel, table=True):
    id: UUID = Field(primary_key=True, default_factory=uuid4)
    created_at: datetime = Field(default_factory=timeutc_factory)
    name: str
    bio: str = Field(default="")
    hashed_pwd: str

class UserCreate(SQLModel):
    name: str = Field(min_length=5, max_length=15)
    plain_pwd: str = Field(min_length=8)

class UserOut(SQLModel):
    id: UUID
    created_at: datetime
    name: str
    bio: str

class UserUpdateBio(SQLModel):
    new_bio: str | None = Field(max_length=2000)

# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: UUID | None = None

class Item(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=timeutc_factory)
    author_id: UUID = Field(foreign_key="user.id")
    title: str
    text: str

class ItemCreate(SQLModel):
    title: str = Field(min_length=1, max_length=25)
    text: str = Field(min_length=1, max_length=2000)

class ItemsOut(SQLModel):
    data: list[Item]
    count: int

# ---------------------------------------------
# Security
# ---------------------------------------------

SECRET_KEY = secrets.token_urlsafe(32)

password_hash = PasswordHash(
    (
        Argon2Hasher(),
        BcryptHasher(),
    )
)

ACCESS_TOKEN_EXPIRE_MINUTES = 30

ALGORITHM = "HS256"

def create_access_token(subject: str | Any, expires_delta: timedelta) -> str:
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, ALGORITHM)
    return encoded_jwt


def verify_password(
    plain_password: str, hashed_password: str
) -> tuple[bool, str | None]:
    return password_hash.verify_and_update(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    return password_hash.hash(password)

# ---------------------------------------------
# Auth 
# ---------------------------------------------

reusable_oauth2 = OAuth2PasswordBearer(tokenUrl="login/access-token")

TokenDep = Annotated[str, Depends(reusable_oauth2)]

def get_current_user(session: SessionDep, token: TokenDep) -> User:
    try:
        payload = jwt.decode(
            token, SECRET_KEY, algorithms=[ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (jwt.InvalidTokenError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    user = session.get(User, token_data.sub)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]

# ---------------------------------------------
# CRUD
# ---------------------------------------------

dummy_hash = get_password_hash("This-is-a-dummy-hash-to-prevent_timing_attacks")

def authenticate(session: Session, name: str, password: str):
    usr_db = session.exec(select(User).where(User.name == name)).first()
    if not usr_db:
        verify_password(password, dummy_hash)
        return None
    verif, new_pwd = verify_password(password, usr_db.hashed_pwd)
    if not verif:
        return None
    if new_pwd:
        usr_db.hashed_pwd = new_pwd
        session.add(usr_db)
        session.commit()
        session.refresh(usr_db)
    return usr_db

# ---------------------------------------------
# App
# ---------------------------------------------

def lifetime(_):
    SQLModel.metadata.create_all(engine)
    yield
    file_path = Path("./database.db")
    if file_path.exists():
        file_path.unlink()

app = FastAPI(lifespan=lifetime)

origins = [
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



# ---------------------------------------------
# Routes
# ---------------------------------------------

# login endpoint
@app.post("/login/access-token", tags=["login"])
def login_access_token(
    session: SessionDep, form_data: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    user = authenticate(
        session=session, name=form_data.username, password=form_data.password
    )
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(
        access_token=create_access_token(
            user.id, expires_delta=access_token_expires
        )
    )

# user endpoints

@app.get("/user/me", tags=["user"], response_model=UserOut)
def get_me(current_user: CurrentUser):
    return current_user

@app.get("/user/{id}", tags=["user"], response_model=UserOut)
def get_user_by_id(session: SessionDep, id: UUID):
    usr = session.exec(select(User).where(User.id == id)).first()
    if not usr:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, deatil="No user with such id")
    return usr

@app.put("/user/", tags=["user"], response_model=UserOut)
def update_bio(session: SessionDep, current_user: CurrentUser, upd: UserUpdateBio):
    current_user.bio = upd.new_bio
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    return current_user

@app.post("/user/", tags=["user"], response_model=UserOut)
def new_user(session: SessionDep, user_in: UserCreate):
    if session.exec(select(User).where(User.name == user_in.name)).first():
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Name already taken")

    db_obj = User.model_validate(user_in, update={"hashed_pwd": get_password_hash(user_in.plain_pwd)})

    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj

@app.get("/user/{id}/items/", tags=["user"], response_model=ItemsOut)
def get_users_items(session: SessionDep,
                   id: UUID,
                   offset: int=0,
                   limit: int = 10):
    count = session.exec(select(func.count()).select_from(Item).where(Item.author_id == id)).one()
    items =[item for item in session.exec(select(Item).where(Item.author_id == id).offset(offset).limit(limit)).all()]
    return ItemsOut(data=items, count=count)

# item endpoints

@app.post("/item/", tags=["item"], response_model=Item)
def create_item(session: SessionDep, current_user: CurrentUser, item_in: ItemCreate):
    db_obj = Item.model_validate(item_in, update={"author_id": current_user.id})
    session.add(db_obj)
    session.commit()
    session.refresh(db_obj)
    return db_obj

@app.get("/item/{id}", tags=["item"], response_model=Item)
def get_item_by_id(session: SessionDep, id: UUID):
    db_obj = session.exec(select(Item).where(Item.id == id)).first()
    if not db_obj:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No Item with such id")
    return db_obj