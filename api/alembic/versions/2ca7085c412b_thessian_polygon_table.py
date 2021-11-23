"""Thessian Polygon table

Revision ID: 2ca7085c412b
Revises: 1caf3488a340
Create Date: 2021-11-22 13:40:29.696175

"""
from alembic import op
import sqlalchemy as sa
import geoalchemy2


# revision identifiers, used by Alembic.
revision = '2ca7085c412b'
down_revision = '1caf3488a340'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('thessian_polygon_area',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('geom', geoalchemy2.types.Geometry(geometry_type='POLYGON', srid=3005, spatial_index=False, from_text='ST_GeomFromEWKT', name='geometry'), nullable=False),
                    sa.Column('station_code', sa.Integer(), nullable=False),
                    sa.Column('create_date', sa.TIMESTAMP(timezone=True), nullable=False),
                    sa.Column('update_date', sa.TIMESTAMP(timezone=True), nullable=False),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_index('idx_thessian_polygon_area_geom', 'thessian_polygon_area', ['geom'], unique=False, postgresql_using='gist')
    op.create_index(op.f('ix_thessian_polygon_area_id'), 'thessian_polygon_area', ['id'], unique=False)
    op.create_index(op.f('ix_thessian_polygon_area_station_code'), 'thessian_polygon_area', ['station_code'], unique=True)
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_thessian_polygon_area_id'), table_name='thessian_polygon_area')
    op.drop_index('idx_thessian_polygon_area_geom',
                  table_name='thessian_polygon_area', postgresql_using='gist')
    op.drop_table('thessian_polygon_area')
    # ### end Alembic commands ###