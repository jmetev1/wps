""" This module contains functions for computing fire weather metrics.
"""
import logging
import app.utils.r_importer
from app.utils.singleton import Singleton


logger = logging.getLogger(__name__)


@Singleton
class CFFDRS():
    """ Singleton that loads CFFDRS R lib once in memory for reuse."""

    def __init__(self):
        # pylint: disable=too-many-function-args
        self.cffdrs = app.utils.r_importer.import_cffsdrs()


class CFFDRSException(Exception):
    """ CFFDRS contextual exception """

#   From cffdrs R package comments:
#   FUELTYPE: The Fire Behaviour Prediction FuelType
#        ISI: Initial Spread Index
#        BUI: Buildup Index
#        FMC: Foliar Moisture Content
#        SFC: Surface Fuel Consumption (kg/m^2)
#         PC: Percent Conifer (%)
#        PDF: Percent Dead Balsam Fir (%)
#         CC: Constant (crown closure)
#        CBH: Crown to base height(m)

# Returns:
#   ROS: Rate of spread (m/min)
#


# Computable: SFC, FMC
# To store in DB: PC, PDF, CC, CBH (attached to fuel type, red book)
PARAMS_ERROR_MESSAGE = "One or more params passed to R call is None."

# PC, PDF, CC, CDH from the Red Book. Assumes values of 1 for unknown CC and CBH.
# TODO: Store then in the DB as columns in FuelType
FUEL_TYPE_LOOKUP = {"C1": {"PC": 100, "PDF": 0, "CC": 1, "CBH": 2},
                    "C2": {"PC": 100, "PDF": 0, "CC": 1, "CBH": 3},
                    "C3": {"PC": 100, "PDF": 0, "CC": 1, "CBH": 8},
                    "C4": {"PC": 100, "PDF": 0, "CC": 1, "CBH": 4},
                    "C5": {"PC": 100, "PDF": 0, "CC": 1, "CBH": 18},
                    # There's a 2m and 7m C6 in RB. Opted for 7m.
                    "C6": {"PC": 100, "PDF": 0, "CC": 1, "CBH": 7},
                    "C7": {"PC": 100, "PDF": 0, "CC": 1, "CBH": 10},
                    # No CBH listed in RB fire intensity class table for D1.
                    "D1": {"PC": 0, "PDF": 0, "CC": 1, "CBH": 1},
                    # No CBH listed in RB fire intensity class table for D2.
                    "D2": {"PC": 0, "PDF": 0, "CC": 1, "CBH": 1},
                    # 3 different PC configurations for M1. Opted for 50%.
                    "M1": {"PC": 50, "PDF": 0, "CC": 1, "CBH": 6},
                    # 3 different PC configurations for M2. Opted for 50%.
                    "M2": {"PC": 50, "PDF": 0, "CC": 1, "CBH": 6},
                    # 3 different PDF configurations for M3. Opted for 60%.
                    "M3": {"PC": 0, "PDF": 60, "CC": 1, "CBH": 6},
                    # 3 different PDF configurations for M4. Opted for 60%.
                    "M4": {"PC": 0, "PDF": 60, "CC": 1, "CBH": 6},
                    "O1A": {"PC": 0, "PDF": 0, "CC": 1, "CBH": 1},
                    "O1B": {"PC": 0, "PDF": 0, "CC": 1, "CBH": 1},
                    "S1": {"PC": 0, "PDF": 0, "CC": 1, "CBH": 1},
                    "S2": {"PC": 0, "PDF": 0, "CC": 1, "CBH": 1},
                    "S3": {"PC": 0, "PDF": 0, "CC": 1, "CBH": 1}
                    }


def rate_of_spread(fuel_type: str, isi: float, bui: float, fmc: float, sfc: float):
    """ Computes ROS by delegating to cffdrs R package """
    if fuel_type is None or isi is None or bui is None or sfc is None:
        message = PARAMS_ERROR_MESSAGE + \
            "fuel_type: {fuel_type}, isi: {isi}, bui: {bui}, fmc: {fmc}, sfc: {sfc}"
        raise CFFDRSException(message)
    # pylint: disable=protected-access, no-member, line-too-long
    result = CFFDRS.instance().cffdrs._ROScalc(FUELTYPE=fuel_type, ISI=isi, BUI=bui, FMC=fmc, SFC=sfc,
                                               PC=FUEL_TYPE_LOOKUP[fuel_type]["PC"],
                                               PDF=FUEL_TYPE_LOOKUP[fuel_type]["PDF"],
                                               CC=FUEL_TYPE_LOOKUP[fuel_type]["CC"],
                                               CBH=FUEL_TYPE_LOOKUP[fuel_type]["CBH"])
    return result[0]

# Args:
#   FUELTYPE: The Fire Behaviour Prediction FuelType
#        BUI: Buildup Index
#       FFMC: Fine Fuel Moisture Code
#         PC: Percent Conifer (%)
#        GFL: Grass Fuel Load (kg/m^2) (3.5 kg/m^2)
# Returns:
#        SFC: Surface Fuel Consumption (kg/m^2)


def surface_fuel_consumption(fuel_type: str, bui: float, ffmc: float):
    """ Computes SFC by delegating to cffdrs R package
        Assumes a standard GFL of 3.5 kg/m ^ 2.
    """
    if fuel_type is None or bui is None or ffmc is None:
        message = PARAMS_ERROR_MESSAGE + \
            "fuel_type: {fuel_type}, bui: {bui}, ffmc: {ffmc}"
        raise CFFDRSException(message)
    # pylint: disable=protected-access, no-member, line-too-long
    result = CFFDRS.instance().cffdrs._SFCcalc(FUELTYPE=fuel_type, BUI=bui, FFMC=ffmc, PC=1, GFL=3.5)
    return result[0]

  # Args:
  #   LAT:    Latitude (decimal degrees)
  #   LONG:   Longitude (decimal degrees)
  #   ELV:    Elevation (metres)
  #   DJ:     Day of year (often referred to as julian date)
  #   D0:     Date of minimum foliar moisture content
  #           (constant date, set by geography across province, 5 different dates)
  #
  # Returns:
  #   FMC:    Foliar Moisture Content


def foliar_moisture_content(lat: int, long: int, elv: float, day_of_year: int):
    """ Computes FMC by delegating to cffdrs R package
        TODO: Find out the minimum fmc date that is passed as D0, for now it's 1.
     """
    # pylint: disable=protected-access, no-member, line-too-long
    result = CFFDRS.instance().cffdrs._FMCcalc(LAT=lat, LONG=long, ELV=elv, DJ=day_of_year, D0=1)
    return result[0]
