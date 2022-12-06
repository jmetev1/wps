"""FireZone table

Revision ID: 3893bbb60779
Revises: d7a9b15ae82f
Create Date: 2022-11-23 14:19:54.373088

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
import geoalchemy2
from models import TZTimeStamp

# revision identifiers, used by Alembic.
revision = '3893bbb60779'
down_revision = 'd7a9b15ae82f'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ### commands auto generated by Alembic ###
    op.create_table('fire_zones',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('feature_id', sa.Integer(), nullable=False),
                    sa.Column('geom', geoalchemy2.types.Geometry(geometry_type='MULTIPOLYGON', srid=4326,
                                                                 spatial_index=False, from_text='ST_GeomFromEWKT', name='geometry'), nullable=False),
                    sa.Column('create_date', TZTimeStamp(), nullable=False),
                    sa.Column('update_date', TZTimeStamp(), nullable=False),
                    sa.Column('mof_fire_zone_id', sa.Integer(), nullable=True),
                    sa.Column('mof_fire_zone_name', sa.String(), nullable=True),
                    sa.Column('mof_fire_centre_name', sa.String(), nullable=True),
                    sa.Column('headquarters_city_name', sa.String(), nullable=True),
                    sa.Column('objectid', sa.Integer(), nullable=True),
                    sa.Column('feature_area_sqm', postgresql.DOUBLE_PRECISION(), nullable=True),
                    sa.Column('feature_length_m', postgresql.DOUBLE_PRECISION(), nullable=True),
                    sa.Column('geometry.area', sa.Integer(), nullable=True),
                    sa.Column('geometry.len', sa.Integer(), nullable=True),
                    sa.PrimaryKeyConstraint('id'),
                    comment='BC fire zone boundaries'
                    )
    op.create_index('idx_fire_zones_geom', 'fire_zones', ['geom'], unique=False, postgresql_using='gist')
    # ### end Alembic commands ###


def downgrade() -> None:
    # ### commands auto generated by Alembic ###
    op.drop_index('idx_fire_zones_geom', table_name='fire_zones', postgresql_using='gist')
    op.drop_table('fire_zones')
    # ### end Alembic commands ###