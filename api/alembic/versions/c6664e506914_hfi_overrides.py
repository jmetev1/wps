"""HFI overrides

Revision ID: c6664e506914
Revises: 839f18e0ecc4
Create Date: 2022-02-08 14:02:06.937065

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c6664e506914'
down_revision = '839f18e0ecc4'
branch_labels = None
depends_on = None


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.create_table('hfi_calc_fire_centre_prep_period',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('fire_centre_id', sa.Integer(), nullable=False),
    sa.Column('prep_start_day', sa.Date(), nullable=False),
    sa.Column('prep_end_day', sa.Date(), nullable=False),
    sa.ForeignKeyConstraint(['fire_centre_id'], ['fire_centres.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('fire_centre_id', 'prep_start_day', name='unique_fire_centre_prep_period'),
    comment='Identifies the unique prep period for a fire centre'
    )
    op.create_index(op.f('ix_hfi_calc_fire_centre_prep_period_fire_centre_id'), 'hfi_calc_fire_centre_prep_period', ['fire_centre_id'], unique=False)
    op.create_index(op.f('ix_hfi_calc_fire_centre_prep_period_id'), 'hfi_calc_fire_centre_prep_period', ['id'], unique=False)
    op.create_index(op.f('ix_hfi_calc_fire_centre_prep_period_prep_start_day'), 'hfi_calc_fire_centre_prep_period', ['prep_start_day'], unique=False)
    op.create_table('hfi_calc_planning_area_selection_override',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('planning_area_id', sa.Integer(), nullable=False),
    sa.Column('station_code', sa.Integer(), nullable=False),
    sa.Column('fuel_type_id', sa.Integer(), nullable=False),
    sa.Column('station_selected', sa.Boolean(), nullable=False),
    sa.ForeignKeyConstraint(['fuel_type_id'], ['fuel_types.id'], ),
    sa.ForeignKeyConstraint(['planning_area_id'], ['planning_areas.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('planning_area_id', 'station_code', name='unique_planning_area_station_code_constraint'),
    comment='Identifies the unique planning area + station code combo to identify overrides'
    )
    op.create_index(op.f('ix_hfi_calc_planning_area_selection_override_fuel_type_id'), 'hfi_calc_planning_area_selection_override', ['fuel_type_id'], unique=False)
    op.create_index(op.f('ix_hfi_calc_planning_area_selection_override_id'), 'hfi_calc_planning_area_selection_override', ['id'], unique=False)
    op.create_index(op.f('ix_hfi_calc_planning_area_selection_override_planning_area_id'), 'hfi_calc_planning_area_selection_override', ['planning_area_id'], unique=False)
    op.create_index(op.f('ix_hfi_calc_planning_area_selection_override_station_code'), 'hfi_calc_planning_area_selection_override', ['station_code'], unique=False)
    op.create_table('hfi_calc_planning_area_selection_override_for_day',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('planning_area_id', sa.Integer(), nullable=False),
    sa.Column('day', sa.Date(), nullable=False),
    sa.Column('fire_starts', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['planning_area_id'], ['planning_areas.id'], ),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('planning_area_id', 'day', name='unique_planning_area_day_constraint'),
    comment='Identifies the unique planning area + day combo to identify overrides'
    )
    op.create_index(op.f('ix_hfi_calc_planning_area_selection_override_for_day_day'), 'hfi_calc_planning_area_selection_override_for_day', ['day'], unique=False)
    op.create_index(op.f('ix_hfi_calc_planning_area_selection_override_for_day_id'), 'hfi_calc_planning_area_selection_override_for_day', ['id'], unique=False)
    op.create_index(op.f('ix_hfi_calc_planning_area_selection_override_for_day_planning_area_id'), 'hfi_calc_planning_area_selection_override_for_day', ['planning_area_id'], unique=False)
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_index(op.f('ix_hfi_calc_planning_area_selection_override_for_day_planning_area_id'), table_name='hfi_calc_planning_area_selection_override_for_day')
    op.drop_index(op.f('ix_hfi_calc_planning_area_selection_override_for_day_id'), table_name='hfi_calc_planning_area_selection_override_for_day')
    op.drop_index(op.f('ix_hfi_calc_planning_area_selection_override_for_day_day'), table_name='hfi_calc_planning_area_selection_override_for_day')
    op.drop_table('hfi_calc_planning_area_selection_override_for_day')
    op.drop_index(op.f('ix_hfi_calc_planning_area_selection_override_station_code'), table_name='hfi_calc_planning_area_selection_override')
    op.drop_index(op.f('ix_hfi_calc_planning_area_selection_override_planning_area_id'), table_name='hfi_calc_planning_area_selection_override')
    op.drop_index(op.f('ix_hfi_calc_planning_area_selection_override_id'), table_name='hfi_calc_planning_area_selection_override')
    op.drop_index(op.f('ix_hfi_calc_planning_area_selection_override_fuel_type_id'), table_name='hfi_calc_planning_area_selection_override')
    op.drop_table('hfi_calc_planning_area_selection_override')
    op.drop_index(op.f('ix_hfi_calc_fire_centre_prep_period_prep_start_day'), table_name='hfi_calc_fire_centre_prep_period')
    op.drop_index(op.f('ix_hfi_calc_fire_centre_prep_period_id'), table_name='hfi_calc_fire_centre_prep_period')
    op.drop_index(op.f('ix_hfi_calc_fire_centre_prep_period_fire_centre_id'), table_name='hfi_calc_fire_centre_prep_period')
    op.drop_table('hfi_calc_fire_centre_prep_period')
    # ### end Alembic commands ###
