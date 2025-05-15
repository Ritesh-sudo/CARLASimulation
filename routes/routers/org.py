from fastapi import FastAPI, APIRouter, Depends, status, requests
from .. import models, schemas
from .. dbconfig import sessionLocal, get_db


router = APIRouter(
    prefix="/org",
    tags=["org"]
)


def get_orgs():
    return {"message": "Hello, this is the orgs endpoint!"}


@router.get("/get_orgs", response_model=list[schemas.OrganizationOut])
def get_orgs(db: sessionLocal = Depends(get_db)):
    """
    Retrieve all organizations from the database.

    Args:
        db (Session, optional): The database session. Defaults to Depends(get_db).

    Returns:
        list: A list of organizations.
    """
    orgs = db.query(models.Organization).all()
    return orgs


@router.post("/create_org", status_code=status.HTTP_201_CREATED, response_model=schemas.OrganizationOut)
def create_org(org: schemas.OrganizationCreate, db: sessionLocal = Depends(get_db)):
    """
    Create a new organization in the database.

    Args:
        org (schemas.OrganizationCreate): The organization data to create.
        db (Session, optional): The database session. Defaults to Depends(get_db).

    Returns:
        dict: A message indicating the result of the operation.
    """

    new_org = models.Organization(
        name=org.name,
        description=org.description,
        created_at=org.created_at,
        updated_at=org.updated_at,
        is_active=org.is_active
    )

    db.add(new_org)
    db.commit()
    db.refresh(new_org)
    return new_org
