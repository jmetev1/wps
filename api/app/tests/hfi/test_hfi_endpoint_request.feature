Feature: /hfi/

    Scenario: HFI - request
        # In this scenario, we expect a request to be loaded from the database - but there isn't one.
        Given I received a hfi-calc <url> <request_json>
        Then the response status code is <status_code>
        And the response is <response_json>

        Examples:
            # TODO: These test currently exposes a "bug" in the code where removing a station from one area, means it's removed from all.
            | url                | request_json                                            | status_code | response_json                                                |
            # Test perfect scenario, we have 2 stations, they're both selected, and they have data for all days.
            | /api/hfi-calc/     | test_hfi_endpoint_request.json                          | 200         | hfi/test_hfi_endpoint_response.json                          |
            # Test scenario where we have 1 station selected, one station deselected, and data for all days.
            | /api/hfi-calc/     | test_hfi_endpoint_request_1_of_2_stations_selected.json | 200         | hfi/test_hfi_endpoint_response_1_of_2_stations_selected.json |
            # Test less than ideal scenario, we have 2 stations, they're both selected, one of them is missing data for one day.
            | /api/hfi-calc/     | test_hfi_endpoint_request_missing_data.json             | 200         | hfi/test_hfi_endpoint_response_missing_data.json             |
            # Test load request scenario
            | /api/hfi-calc/load | test_hfi_endpoint_request_load.json                     | 200         | hfi/test_hfi_endpoint_load_response.json                     |

    Scenario: HFI - pdf download
        Given I received a hfi-calc <url> <request_json>
        Then the response status code is <status_code>

        Examples:
            # TODO: These test currently exposes a "bug" in the code where removing a station from one area, means it's removed from all.
            | url                        | request_json                   | status_code |
            # Test perfect scenario, we have 2 stations, they're both selected, and they have data for all days.
            | /api/hfi-calc/download-pdf | test_hfi_endpoint_request.json | 200         |
