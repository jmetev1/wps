"""Thessian Polygon table

Revision ID: 11b821827824
Revises: 1caf3488a340
Create Date: 2021-11-22 11:27:34.812759

"""
from alembic import op
import sqlalchemy as sa
import geoalchemy2


# revision identifiers, used by Alembic.
revision = '11b821827824'
down_revision = '1caf3488a340'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('fire_area_thessian_polygons',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('polygon', geoalchemy2.types.Geometry(geometry_type='POLYGON',
                              from_text='ST_GeomFromGeoJSON', name='geometry'), nullable=True),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_index(op.f('ix_fire_area_thessian_polygons_id'),
                    'fire_area_thessian_polygons', ['id'], unique=False)
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_fire_area_thessian_polygons_id'), table_name='fire_area_thessian_polygons')
    op.drop_table('fire_area_thessian_polygons')
    # ### end Alembic commands ###
