-- Migration 027: Seed 30 IRDAI-approved Indian TPA vendors
-- Dependencies: tpa_vendors (019), irdai columns (026)
-- Source: docs/tpa_vendors.csv

INSERT INTO tpa_vendors (vendor_code, name, panel_type, irdai_registration_no, address, toll_free_helpline, email, is_active, settlement_tat_days)
VALUES
-- 1. Medi Assist Insurance TPA
('TPA001', 'Medi Assist Insurance TPA Pvt. Ltd.', 'Private', '003',
 'Tower D, IBC Knowledge Park, Bengaluru', '1800-425-9449', 'info@mediassist.in', TRUE, 21),

-- 2. MDIndia Health Insurance TPA
('TPA002', 'MDIndia Health Insurance TPA Pvt. Ltd.', 'Private', '005',
 'S. No. 46/1, E-Space IT Park, Pune', '1800-233-1166', 'customercare@mdindia.com', TRUE, 25),

-- 3. Paramount Health Services
('TPA003', 'Paramount Health Services & Insurance TPA Pvt. Ltd.', 'Private', '006',
 'Plot No. A-442, Wagle Industrial Estate, Thane', '1800-22-6655', 'contact@paramounttpa.com', TRUE, 30),

-- 4. Heritage Health Insurance TPA
('TPA004', 'Heritage Health Insurance TPA Pvt. Ltd.', 'Private', '008',
 'NICCO House, 5th Floor, Kolkata', '1800-102-4747', 'heritage_health@bajajallianz.co.in', TRUE, 28),

-- 5. Family Health Plan Insurance TPA (FHPL)
('TPA005', 'Family Health Plan Insurance TPA Ltd.', 'Private', '013',
 'Srinilaya Cyber Spazio, Banjara Hills, Hyderabad', '1800-425-4033', 'info@fhpl.net', TRUE, 21),

-- 6. Raksha Health Insurance TPA
('TPA006', 'Raksha Health Insurance TPA Pvt. Ltd.', 'CGHS', '015',
 'C/o Escorts Corporate Centre, Faridabad', '1800-180-1444', 'crcm@rakshatpa.com', TRUE, 30),

-- 7. Vidal Health Insurance TPA
('TPA007', 'Vidal Health Insurance TPA Pvt. Ltd.', 'Private', '016',
 '1st Floor, Tower 2, Banni Corporate Park, Bengaluru', '1800-425-8885', 'customerservice@vidalhealthtpa.com', TRUE, 21),

-- 8. Medsave Health Insurance TPA
('TPA008', 'Medsave Health Insurance TPA Ltd.', 'CGHS', '019',
 'F-701A, Lado Sarai, New Delhi', '1800-11-1142', 'customercare@medsave.in', TRUE, 30),

-- 9. Genins India Insurance TPA
('TPA009', 'Genins India Insurance TPA Ltd.', 'Private', '020',
 'A-117, Sector-2, Noida', '1800-103-3050', 'info@geninsindia.com', TRUE, 25),

-- 10. Health India Insurance TPA Services
('TPA010', 'Health India Insurance TPA Services Pvt. Ltd.', 'Private', '022',
 'Neelkanth Corporate Park, Vidyavihar, Mumbai', '1800-220-102', 'info@healthindiatpa.com', TRUE, 28),

-- 11. Good Health Insurance TPA
('TPA011', 'Good Health Insurance TPA Ltd.', 'CGHS', '023',
 'Kukatpally Housing Board Colony, Hyderabad', '1800-102-7710', 'info@ghpltpa.com', TRUE, 25),

-- 12. Park Mediclaim TPA
('TPA012', 'Park Mediclaim TPA Pvt. Ltd.', 'Private', '025',
 '702, Vikrant Tower, Rajendra Place, New Delhi', '1800-11-5533', 'info@parkmediclaim.co.in', TRUE, 30),

-- 13. Safeway Insurance TPA
('TPA013', 'Safeway Insurance TPA Pvt. Ltd.', 'Private', '026',
 '815, Vishwadeep Building, District Centre, New Delhi', '1800-102-5678', 'info@safewaytpa.in', TRUE, 28),

-- 14. Anmol Medicare TPA
('TPA014', 'Anmol Medicare TPA Ltd.', 'Private', '027',
 'Anmol House, 12/B, Navrangpura, Ahmedabad', '1800-233-2525', 'info@anmolmedicare.com', TRUE, 30),

-- 15. Grand Health TPA Services
('TPA015', 'Grand Health TPA Services Pvt. Ltd.', 'Private', '029',
 'Plot No 123, Sector 44, Gurugram', '1800-102-9900', 'support@grandhealthtpa.com', TRUE, 25),

-- 16. Rothshield Insurance TPA
('TPA016', 'Rothshield Insurance TPA Ltd.', 'Private', '030',
 '402, Raheja Chambers, Nariman Point, Mumbai', '1800-22-2021', 'info@rothshield.co.in', TRUE, 28),

-- 17. Ericson Insurance TPA
('TPA017', 'Ericson Insurance TPA Pvt. Ltd.', 'Private', '035',
 '11C/D, 2nd Floor, Goregaon East, Mumbai', '1800-22-2035', 'info@ericsontpa.com', TRUE, 30),

-- 18. Health Insurance TPA of India
('TPA018', 'Health Insurance TPA of India Ltd.', 'PSU', '036',
 'NBCC House, 4th Floor, Lodhi Road, New Delhi', '1800-102-3600', 'customerservice@hitpa.co.in', TRUE, 30),

-- 19. Vision Digital India TPA
('TPA019', 'Vision Digital India TPA Pvt. Ltd.', 'Private', '037',
 '7th Floor, DLF Cyber City, Gurugram', '1800-102-7788', 'support@visiontpa.in', TRUE, 21),

-- 20. United Health Care Parekh Insurance TPA
('TPA020', 'United Health Care Parekh Insurance TPA Pvt. Ltd.', 'Private', '002',
 'B-Wing, 5th Floor, Andheri Kurla Road, Mumbai', '1800-22-2822', 'info@uhcpindia.com', TRUE, 25),

-- 21. East West Assist TPA
('TPA021', 'East West Assist TPA Pvt. Ltd.', 'Private', '014',
 '38/1, East Patel Nagar, New Delhi', '1800-11-4646', 'info@eastwestassist.com', TRUE, 28),

-- 22. Alankit Health Care TPA
('TPA022', 'Alankit Health Care TPA Ltd.', 'CGHS', '012',
 'Alankit House, Jhandewalan Extension, New Delhi', '1800-11-1111', 'health@alankit.com', TRUE, 30),

-- 23. Dedicated Healthcare Services TPA
('TPA023', 'Dedicated Healthcare Services TPA Pvt. Ltd.', 'Private', '021',
 'DHS House, Vile Parle East, Mumbai', '1800-22-0211', 'info@dhstpa.com', TRUE, 25),

-- 24. Any Time Medicare TPA
('TPA024', 'Any Time Medicare TPA', 'Private', '024',
 '101, First Floor, Okhla Phase 3, New Delhi', '1800-11-2424', 'contact@anytimemedicare.com', TRUE, 30),

-- 25. Sunrise Medicare TPA
('TPA025', 'Sunrise Medicare TPA Pvt. Ltd.', 'Private', '028',
 'A-45, Sector 63, Noida', '1800-103-2828', 'support@sunrisetpa.com', TRUE, 25),

-- 26. Apollo Munich Health TPA
('TPA026', 'Apollo Munich Health TPA', 'Private', '031',
 'Apollo Hospitals, Greams Road, Chennai', '1800-102-0333', 'info@apollohealth.com', TRUE, 21),

-- 27. Care Health Insurance TPA
('TPA027', 'Care Health Insurance TPA', 'Private', '032',
 'Vipul Tech Square, Golf Course Road, Gurugram', '1800-102-4488', 'customerfirst@careinsurance.com', TRUE, 21),

-- 28. Star Health and Allied TPA
('TPA028', 'Star Health and Allied TPA', 'Private', '033',
 '1, New Tank Street, Nungambakkam, Chennai', '1800-425-2255', 'support@starhealth.in', TRUE, 21),

-- 29. Navi General Insurance TPA
('TPA029', 'Navi General Insurance TPA', 'Private', '034',
 'Salarpuria Business Center, Koramangala, Bengaluru', '1800-102-2255', 'help@navi.com', TRUE, 25),

-- 30. Reliance General Health TPA
('TPA030', 'Reliance General Health TPA', 'PSU', '038',
 'Reliance Centre, Prabhat Colony, Mumbai', '1800-300-9000', 'services@reliancehealth.com', TRUE, 25)

ON CONFLICT (vendor_code) DO UPDATE SET
    name = EXCLUDED.name,
    irdai_registration_no = EXCLUDED.irdai_registration_no,
    address = EXCLUDED.address,
    toll_free_helpline = EXCLUDED.toll_free_helpline,
    email = EXCLUDED.email,
    updated_at = NOW();

COMMENT ON TABLE tpa_vendors IS 'Master registry — seeded with 30 IRDAI-approved Indian TPA vendors';
