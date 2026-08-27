"""
Seeded road-segment + contract data for Phase 7B (jurisdiction matching).

Simplified per the deployment playbook: 5-10 manually seeded rows approximating
a real drive route, not a real GeoSadak/PMGSY dataset ingestion. Contractor names,
tender numbers, and officer titles follow real PMGSY/PWD bidding-document
conventions (5-year Defects Liability Period, "PWD/<state>/<year>/RM-<serial>"
tender numbering, "Executive Engineer, PWD <division>" officer titles) but are
illustrative, not drawn from an actual government tender registry.

Road segments cluster around central Delhi (28.6139, 77.2090), the coordinates
used by the demo's test captures, so at least one segment is a close match and
several are deliberately far enough away to exercise the fail-closed "uncertain"
path.
"""

from datetime import date

SEGMENTS = [
    {
        "road_name": "Kartavya Path, New Delhi",
        "gps_lat": 28.6139,
        "gps_lon": 77.2090,
        "contractor_name": "Shree Balaji Construction Co.",
        "tender_number": "PWD/NCT/2023/RM-118",
        "responsible_officer": "Executive Engineer, PWD Delhi Division IV",
        "completion_date": date(2023, 11, 15),
        "dlp_years": 5,
    },
    {
        "road_name": "Tilak Marg, New Delhi",
        "gps_lat": 28.6160,
        "gps_lon": 77.2110,
        "contractor_name": "Anand Infra Projects Pvt. Ltd.",
        "tender_number": "PWD/NCT/2022/RM-076",
        "responsible_officer": "Executive Engineer, PWD Delhi Division III",
        "completion_date": date(2022, 3, 1),
        "dlp_years": 5,
    },
    {
        "road_name": "Man Singh Road, New Delhi",
        "gps_lat": 28.6100,
        "gps_lon": 77.2050,
        "contractor_name": "Modern Road Builders",
        "tender_number": "PWD/NCT/2021/RM-054",
        "responsible_officer": "Executive Engineer, PWD Delhi Division II",
        "completion_date": date(2020, 8, 20),
        "dlp_years": 5,
    },
    {
        "road_name": "Ring Road (ITO), Delhi",
        "gps_lat": 28.6500,
        "gps_lon": 77.2300,
        "contractor_name": "Capital Highways Ltd.",
        "tender_number": "PWD/NCT/2023/RM-142",
        "responsible_officer": "Executive Engineer, PWD Delhi Division I",
        "completion_date": date(2023, 6, 10),
        "dlp_years": 5,
    },
    {
        "road_name": "Aurobindo Marg, New Delhi",
        "gps_lat": 28.5800,
        "gps_lon": 77.1900,
        "contractor_name": "Sunrise Road Contractors",
        "tender_number": "PWD/NCT/2022/RM-091",
        "responsible_officer": "Executive Engineer, PWD Delhi Division V",
        "completion_date": date(2022, 9, 5),
        "dlp_years": 5,
    },
    {
        "road_name": "Bhagwan Das Road, New Delhi",
        "gps_lat": 28.6350,
        "gps_lon": 77.2200,
        "contractor_name": "Metro Infra Developers Pvt. Ltd.",
        "tender_number": "PWD/NCT/2024/RM-165",
        "responsible_officer": "Executive Engineer, PWD Delhi Division IV",
        "completion_date": date(2024, 1, 25),
        "dlp_years": 5,
    },
]
