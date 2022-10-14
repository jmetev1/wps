"""Fuel Type

Revision ID: e71f0965f6e0
Revises: d9c05cb16869
Create Date: 2022-09-08 16:13:02.083018

"""
from alembic import op
import sqlalchemy as sa
import geoalchemy2


# revision identifiers, used by Alembic.
revision = 'e71f0965f6e0'
down_revision = 'd9c05cb16869'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic ###
    op.create_table('advisory_fuel_types',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('fuel_type_id', sa.Integer(), nullable=False),
                    sa.Column('geom', geoalchemy2.types.Geometry(geometry_type='POLYGON', srid=3005,
                                                                 spatial_index=False, from_text='ST_GeomFromEWKT', name='geometry'), nullable=True),
                    sa.PrimaryKeyConstraint('id'),
                    comment='Identify some kind of fuel type'
                    )
    op.create_index('idx_advisory_fuel_types_geom', 'advisory_fuel_types',
                    ['geom'], unique=False, postgresql_using='gist')
    op.create_index(op.f('ix_advisory_fuel_types_fuel_type_id'), 'advisory_fuel_types', ['fuel_type_id'], unique=False)
    op.create_index(op.f('ix_advisory_fuel_types_id'), 'advisory_fuel_types', ['id'], unique=False)
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic ###
    op.drop_index(op.f('ix_advisory_fuel_types_id'), table_name='advisory_fuel_types')
    op.drop_index(op.f('ix_advisory_fuel_types_fuel_type_id'), table_name='advisory_fuel_types')
    op.drop_index('idx_advisory_fuel_types_geom', table_name='advisory_fuel_types', postgresql_using='gist')
    op.drop_table('advisory_fuel_types')
    # ### end Alembic commands ###
