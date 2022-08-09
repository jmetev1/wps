from sqlalchemy import (Column, Integer, Float, Date)
from app.db.database import Base


class FireZoneAdvisory(Base):
    """ 
    TODO: this needs unique constrainsts etc. etc.
    """
    __tablename__ = 'advisory_fire_zones'
    __table_args__ = (
        {'comment': 'Information about advisories.'}
    )
    id = Column(Integer, primary_key=True, index=True)
    for_date = Column(Date, nullable=False, index=True)
    # TODO: the official spec has two different numbers!
    mof_fire_zone_id = Column(Integer, nullable=False, index=True)
    elevated_hfi_area = Column(Float, nullable=False)
    elevated_hfi_percentage = Column(Float, nullable=False)
