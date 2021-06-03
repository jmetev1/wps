"""Added HFI calc tables

Revision ID: 43dce8db9afb
Revises: aa82757b1084
Create Date: 2021-06-01 12:08:35.550826

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '43dce8db9afb'
down_revision = 'aa82757b1084'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic ###
    op.create_table('fire_centres',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('name', sa.String(), nullable=False),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_index(op.f('ix_fire_centres_id'), 'fire_centres', ['id'], unique=False)
    op.create_index(op.f('ix_fire_centres_name'), 'fire_centres', ['name'], unique=False)
    op.create_table('fuel_types',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('abbrev', sa.String(), nullable=False),
                    sa.Column('description', sa.String(), nullable=True),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_index(op.f('ix_fuel_types_id'), 'fuel_types', ['id'], unique=False)
    op.create_table('planning_areas',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('name', sa.String(), nullable=False),
                    sa.Column('fire_centre_id', sa.Integer(), nullable=False),
                    sa.ForeignKeyConstraint(['fire_centre_id'], ['fire_centres.id'], ),
                    sa.PrimaryKeyConstraint('id')
                    )
    op.create_index(op.f('ix_planning_areas_fire_centre_id'),
                    'planning_areas', ['fire_centre_id'], unique=False)
    op.create_index(op.f('ix_planning_areas_id'), 'planning_areas', ['id'], unique=False)
    op.create_index(op.f('ix_planning_areas_name'), 'planning_areas', ['name'], unique=False)
    op.create_table('planning_weather_stations',
                    sa.Column('id', sa.Integer(), nullable=False),
                    sa.Column('station_code', sa.Integer(), nullable=False),
                    sa.Column('station_name', sa.String(), nullable=False),
                    sa.Column('fuel_type_id', sa.Integer(), nullable=False),
                    sa.Column('planning_area_id', sa.Integer(), nullable=False),
                    sa.Column('elevation', sa.Integer(), nullable=False),
                    sa.ForeignKeyConstraint(['fuel_type_id'], ['fuel_types.id'], ),
                    sa.ForeignKeyConstraint(['planning_area_id'], ['planning_areas.id'], ),
                    sa.PrimaryKeyConstraint('id'),
                    sa.UniqueConstraint('station_code'),
                    comment='Identifies the unique code used to identify the station'
                    )
    op.create_index(op.f('ix_planning_weather_stations_fuel_type_id'),
                    'planning_weather_stations', ['fuel_type_id'], unique=False)
    op.create_index(op.f('ix_planning_weather_stations_id'),
                    'planning_weather_stations', ['id'], unique=False)
    op.create_index(op.f('ix_planning_weather_stations_planning_area_id'),
                    'planning_weather_stations', ['planning_area_id'], unique=False)
    op.create_index(op.f('ix_planning_weather_stations_station_code'),
                    'planning_weather_stations', ['station_code'], unique=False)
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic ###
    op.drop_index(op.f('ix_planning_weather_stations_station_code'), table_name='planning_weather_stations')
    op.drop_index(op.f('ix_planning_weather_stations_planning_area_id'),
                  table_name='planning_weather_stations')
    op.drop_index(op.f('ix_planning_weather_stations_id'), table_name='planning_weather_stations')
    op.drop_index(op.f('ix_planning_weather_stations_fuel_type_id'), table_name='planning_weather_stations')
    op.drop_table('planning_weather_stations')
    op.drop_index(op.f('ix_planning_areas_name'), table_name='planning_areas')
    op.drop_index(op.f('ix_planning_areas_id'), table_name='planning_areas')
    op.drop_index(op.f('ix_planning_areas_fire_centre_id'), table_name='planning_areas')
    op.drop_table('planning_areas')
    op.drop_index(op.f('ix_fuel_types_id'), table_name='fuel_types')
    op.drop_table('fuel_types')
    op.drop_index(op.f('ix_fire_centres_name'), table_name='fire_centres')
    op.drop_index(op.f('ix_fire_centres_id'), table_name='fire_centres')
    op.drop_table('fire_centres')
    # ### end Alembic commands ###
