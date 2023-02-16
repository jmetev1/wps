"""Remove unique station per planning area constraint

Revision ID: 157ba3a3f3fb
Revises: 35acf3b96d8a
Create Date: 2022-07-12 15:26:24.694351

"""
from alembic import op


# revision identifiers, used by Alembic.
revision = '157ba3a3f3fb'
down_revision = '35acf3b96d8a'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic ###
    op.drop_constraint('unique_station_code_for_planning_area', 'planning_weather_stations', type_='unique')
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic ###
    op.create_unique_constraint('unique_station_code_for_planning_area',
                                'planning_weather_stations', ['station_code', 'planning_area_id'])
    # ### end Alembic commands ###
