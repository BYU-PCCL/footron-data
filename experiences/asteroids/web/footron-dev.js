// DEV testing tools TODO: remove for prod
// const notCrashing = {
//   // Solar system
//   Sun: "sun",
//   // Planets
//   Mercury: "mercury",
//   Venus: "venus",
//   Earth: "earth",
//   Mars: "mars",
//   Jupiter: "jupiter",
//   Saturn: "saturn",
//   Uranus: "uranus",
//   Neptune: "neptune",
//   // Dwarf planets
//   Ceres: "1_ceres",
//   // Asteroids
//   Bennu: "101955_bennu",
//   Leucus: "11351_leucus",
//   Polymele: "15094_polymele",
//   Ryugu: "162173_ryugu",
//   Lutetia: "21_lutetia",
//   Orus: "21900_orus",
//   Ida: "243_ida",
//   Itokawa: "25143_itokawa",
//   Mathilde: "253_mathilde",
//   Eurybates: "3548_eurybates",
//   Vesta: "4_vesta",
//   Eros: "433_eros",
//   Donaldjohanson: "52246_donaldjohanson",
//   Annefrank: "5535_annefrank",
//   Patroclus: "617_patroclus",
//   "Patroclus barycenter": "617_patroclus_barycenter",
//   Psyche: "16_psyche",
//   Didymos: "65803_didymos",
//   Gaspra: "951_gaspra",
//   Braille: "9969_braille",
//   Apophis: "99942_apophis",
//   Dinkinesh: "152830_dinkinesh",
//   // Moons
//   "Didymos - Dimorphos": "dimorphos",
//   "Patroclus - Menoetius": "menoetius",
//   "Earth - Moon (Luna)": "moon",
//   // Comets
//   "Hartley 2": "103p_hartley_2",
//   "Tempel 1": "9p_tempel_1",const broken = [
//   "134340_pluto", "136108_haumea", "136199_eris", "136472_makemake", "12923_zephyr",
//   "134340_pluto_barycenter", "14827_hypnos", "1566_icarus", "1620_geographos", "1862_apollo", 
//   "1981_midas", "1991_vg", "1993_hd", "1994_cc_a", "1996_xb27", "1998_ky26", "1998_ml14", "1998_qe2", 
//   "1999_ao10", "1999_cg9", "1999_vx25", "2_pallas", "2000_ae205", "2000_lg6", "2000_sg344", 
//   "2001_bb16", "2001_fr85", "2001_gp2", "2001_qj142", "2001_sn263_a", "2003_sm84", "2003_uv11", 
//   "2003_yn107", "2005_er95", "2005_lc", "2005_qp87", "2005_yu55", "2006_bz147", "2006_jy26", 
//   "2006_qq56", "2006_rh120", "2006_ub17", "2007_tf15", "2007_un12", "2007_vu6", "2008_bt2", 
//   "2008_cx118", "2008_ea9", "2008_el", "2008_hu4", "2008_jl24", "2008_kt", "2008_tc3", "2008_ts10", 
//   "2008_ua202", "2009_bd", "2009_os5", "2009_rt1", "2009_yf", "2010_an61", "2010_dj", "2010_jw34", 
//   "2010_tg19", "2010_tn167", "2010_ub", "2063_bacchus", "2101_adonis", "2102_tantalus", 
//   "2135_aristaeus", "216_kleopatra", "225088_2007_or10", "2340_hathor", "2867_steins", "3_juno", 
//   "3122_florence", "3200_phaethon", "3362_khufu", "367943_duende", "37655_illapa", 
//   "4015_wilson--harrington", "4179_toutatis", "4183_cuno", "4450_pan", "4486_mithra", "4769_castalia", 
//   "486958_arrokoth", "5011_ptah", "6239_minos", "6489_golevka", "66391_moshup", "69230_hermes", 
//   "90377_sedna", "charon", "hydra", "kerberos", "nix", "styx", "dactyl", "hiiaka", "namaka",
//   "adrastea", "amalthea", "callisto", "europa", "ganymede", "io", "metis", "thebe", "aitne", 
//   "ananke", "aoede", "arche", "autonoe", "callirrhoe", "carme", "carpo", "chaldene", "cyllene", 
//   "dia", "eirene", "elara", "erinome", "ersa", "euanthe", "eukelade", "eupheme", "euporie", 
//   "eurydome", "harpalyke", "hegemone", "helike", "hermippe", "herse", "himalia", "iocaste", 
//   "isonoe", "jupiter_li", "jupiter_lii", "jupiter_liv", "jupiter_lv", "jupiter_lvi", "jupiter_lix", 
//   "jupiter_lxi", "jupiter_lxiii", "jupiter_lxiv", "jupiter_lxvi", "jupiter_lxvii", "jupiter_lxviii", 
//   "jupiter_lxix", "jupiter_lxx", "jupiter_lxxii", "kale", "kallichore", "kalyke", "kore", "leda", 
//   "lysithea", "megaclite", "mneme", "orthosie", "pandia", "pasiphae", "pasithee", "philophrosyne", 
//   "praxidike", "s_2003_j_2", "s_2003_j_4", "s_2003_j_9", "s_2003_j_10", "s_2003_j_12", "s_2003_j_16", 
//   "s_2003_j_23", "s_2003_j_24", "s_2011_j_3", "s_2016_j_3", "s_2016_j_4", "s_2018_j_2", "s_2018_j_3", 
//   "s_2018_j_4", "s_2021_j_1", "s_2021_j_2", "s_2021_j_3", "s_2021_j_4", "s_2021_j_5", "s_2021_j_6", 
//   "s_2022_j_1", "s_2022_j_2", "s_2022_j_3", "sinope", "sponde", "taygete", "thelxinoe", "themisto", 
//   "thyone", "valetudo", "phobos", "deimos", "despina", "galatea", "halimede",
//   "hippocamp", "laomedeia", "larissa", "naiad", "nereid", "neso", "proteus", "psamathe", "sao", 
//   "thalassa", "triton", "dione", "enceladus", "hyperion", "iapetus", "mimas", "rhea", "tethys", 
//   "titan", "aegaeon", "aegir", "albiorix", "alvaldi", "angrboda", "anthe", "atlas", "bebhionn", 
//   "beli", "bergelmir", "bestla", "calypso", "daphnis", "eggther", "epimetheus", "erriapus", 
//   "farbauti", "fenrir", "fornjot", "geirrod", "gerd", "greip", "gridr", "gunnlod", "hati", 
//   "helene", "hyrrokkin", "ijiraq", "janus", "jarnsaxa", "kari", "kiviuq", "loge", "methone", 
//   "mundilfari", "narvi", "paaliaq", "pallene", "pan", "pandora", "phoebe", "polydeuces", 
//   "prometheus", "s_2004_s_7", "s_2004_s_12", "s_2004_s_13", "s_2004_s_17", "s_2004_s_21", 
//   "s_2004_s_24", "s_2004_s_28", "s_2004_s_31", "s_2004_s_36", "s_2004_s_37", "s_2004_s_39", 
//   "s_2006_s_1", "s_2006_s_3", "s_2007_s_2", "s_2007_s_3", "s_2009_s_1", "s_2019_s_1", "saturn_lviii", 
//   "saturn_lx", "saturn_lxiv", "siarnaq", "skathi", "skoll", "skrymir", "surtur", "suttungr", 
//   "tarqeq", "tarvos", "telesto", "thiazzi", "thrymr", "ymir", "s_2004_s_40", "s_2004_s_41", 
//   "s_2004_s_42", "s_2004_s_43", "s_2004_s_44", "s_2004_s_45",
//   "s_2004_s_46", "s_2004_s_47", "s_2004_s_48", "s_2004_s_49", "s_2004_s_50", "s_2004_s_51", 
//   "s_2004_s_52", "s_2004_s_53", "s_2005_s_4", "s_2005_s_5", "s_2006_s_10", "s_2006_s_11", 
//   "s_2006_s_12", "s_2006_s_13", "s_2006_s_14", "s_2006_s_15", "s_2006_s_16", "s_2006_s_17", 
//   "s_2006_s_18", "s_2006_s_19", "s_2006_s_20", "s_2006_s_9", "s_2007_s_5", "s_2007_s_6", "s_2007_s_7", 
//   "s_2007_s_8", "s_2007_s_9", "s_2019_s_10", "s_2019_s_11", "s_2019_s_12", "s_2019_s_13", 
//   "s_2019_s_14", "s_2019_s_15", "s_2019_s_16", "s_2019_s_17", "s_2019_s_18", "s_2019_s_19", 
//   "s_2019_s_2", "s_2019_s_20", "s_2019_s_21", "s_2019_s_3", "s_2019_s_4", "s_2019_s_5", "s_2019_s_6", 
//   "s_2019_s_7", "s_2019_s_8", "s_2019_s_9", "s_2020_s_1", "s_2020_s_10", "s_2020_s_2", "s_2020_s_3", 
//   "s_2020_s_4", "s_2020_s_5", "s_2020_s_6", "s_2020_s_7", "s_2020_s_8", "s_2020_s_9", "ariel", 
//   "miranda", "oberon", "titania", "umbriel", "belinda", "bianca", "caliban", "cordelia", 
//   "cressida", "cupid", "desdemona", "ferdinand", "francisco", "juliet", "mab", "margaret", 
//   "ophelia", "perdita", "portia", "prospero", "puck", "rosalind", "setebos", "stephano", "sycorax", 
//   "trinculo", "1i_oumuamua", "1p_halley", "c_1995_o1", "c_2010_x1", "c_2012_s1", "c_2013_a1", 
//   "c_2019_y4", "c_2020_f3", "sc_3d_winds", "sc_ace", "sc_acrimsat", "sc_aim", "sc_aqua", 
//   "sc_ascends", "sc_aura", "sc_c_nofs",
//   "sc_calipso", "sc_chandra", "sc_clarreo", "sc_cloudsat", "sc_cluster_ii_fm5", "sc_cluster_ii_fm6", 
//   "sc_cluster_ii_fm7", "sc_cluster_ii_fm8", "sc_cygnss_1", "sc_cygnss_2", "sc_cygnss_3", "sc_cygnss_4", 
//   "sc_cygnss_5", "sc_cygnss_6", "sc_cygnss_7", "sc_cygnss_8", "sc_dscovr", "sc_eo_1", "sc_explorer_1", 
//   "sc_face", "sc_fgrst", "sc_gacm", "sc_galex", "sc_geo_cape", "sc_geotail", "sc_goes_12", 
//   "sc_goes_13", "sc_goes_14", "sc_goes_15", "sc_gpm", "sc_grace_1", "sc_grace_2", "sc_grace_fo1", 
//   "sc_grace_fo2", "sc_grifex", "sc_hubble_space_telescope", "sc_hyspiri", "sc_ibex", "sc_icesat_2", 
//   "sc_image", "sc_integral", "sc_ipex", "sc_isas", "sc_iss", "sc_iss_ecostress", "sc_iss_emit", 
//   "sc_iss_oco_3", "sc_iss_rapidscat", "sc_ixpe", "sc_jason_1", "sc_jason_2", "sc_jason_3", "sc_jwst", 
//   "sc_landsat_5", "sc_landsat_7", "sc_landsat_8", "sc_landsat_9", "sc_list", "sc_m_cubed", 
//   "sc_mcubed_2", "sc_mms_1", "sc_mms_2", "sc_mms_3", "sc_mms_4", "sc_nisar", "sc_noaa_14", 
//   "sc_noaa_15", "sc_noaa_16", "sc_noaa_17", "sc_noaa_18", "sc_noaa_19", "sc_nustar", "sc_oco_2", 
//   "sc_path", "sc_polar", "sc_quikscat", "sc_race", "sc_raincube", "sc_rax_2", "sc_rbsp_a", 
//   "sc_rbsp_b", "sc_sac_d", "sc_sclp", "sc_sdo", "sc_sentinel_6", "sc_smap", "sc_soho", "sc_sorce", 
//   "sc_starling_1", "sc_starling_2", "sc_starling_3", "sc_starling_4", "sc_suomi_npp", "sc_swift", 
//   "sc_swot", "sc_tdrs_3", "sc_tdrs_5", "sc_tdrs_6", "sc_tdrs_7", "sc_tdrs_8",
//   "sc_tdrs_9", "sc_tdrs_10", "sc_tdrs_11", "sc_tdrs_12", "sc_tdrs_13", "sc_terra", "sc_tess", 
//   "sc_themis_a", "sc_themis_d", "sc_themis_e", "sc_timed", "sc_trmm", "sc_uars", "sc_wind", 
//   "sc_wise", "sc_apollo_15", "sc_artemis_1", "sc_capstone", "sc_clementine", "sc_grail_a", 
//   "sc_grail_b", "sc_ladee", "sc_lcross", "sc_lcross_impact_site", "sc_lunar_flashlight", 
//   "sc_lunar_icecube", "sc_lunar_prospector", "sc_lunar_reconnaissance_orbiter", "sc_smart_1", 
//   "sc_themis_b", "sc_themis_c", "sc_mars_2020", "sc_mars_2020_landing_site", "sc_mars_science_laboratory", 
//   "sc_mars_science_laboratory_landing_site", "sc_mars_exploration_rover_1", 
//   "sc_mars_exploration_rover_1_landing_site", "sc_mars_exploration_rover_2", 
//   "sc_mars_exploration_rover_2_landing_site", "sc_insight", "sc_insight_landing_site", "sc_marco_a", 
//   "sc_marco_b", "sc_mars_odyssey", "sc_mars_reconnaissance_orbiter", "sc_maven", "sc_mars_express", 
//   "sc_phoenix", "sc_phoenix_landing_site", "sc_trace_gas_orbiter", "sc_mars_orbiter_mission", 
//   "sc_mars_global_surveyor", "sc_mars_climate_orbiter", "sc_mars_pathfinder", 
//   "sc_mars_pathfinder_landing_site", "sc_mars_polar_lander", "sc_viking_1_orbiter", 
//   "sc_viking_1_lander_landing_site", "sc_viking_2_orbiter", "sc_viking_2_lander_landing_site", 
//   "sc_messenger", "sc_messenger_impact_site", "sc_juno", "sc_cassini", "sc_europa_clipper", 
//   "sc_galileo_probe", "sc_huygens", "sc_huygens_landing_site", "sc_juice", "sc_pioneer_10", 
//   "sc_pioneer_11", "sc_voyager_1", "sc_voyager_2", "sc_deep_impact_impactor_impact_site", 
//   "sc_near_shoemaker_landing_site", "sc_new_horizons", "sc_rosetta_impact_site", "sc_philae_landing_site", 
//   "sc_biosentinel", "sc_kepler_space_telescope", "sc_mariner_2", "sc_parker_solar_probe", "sc_spitzer", 
//   "sc_stereo_ahead", "sc_stereo_behind", "sc_ulysses", "sc_wmap", "sc_magellan", "sc_venus_express", 
//   "rose_bowl", "school_bus", "scientist",
// ];
//   "Wild 2": "81p_wild_2",
//   "Churyumov Gerasimenko": "67p_churyumov_gerasimenko",
//   Borrelly: "19p_borrelly",
//   // Spacecraft
//   Galileo: "sc_galileo",
//   Dart: "sc_dart",
//   Dawn: "sc_dawn",
//   "Deep impact": "sc_deep_impact",
//   "Deep impact_impactor": "sc_deep_impact_impactor",
//   "Deep space_1": "sc_deep_space_1",
//   "Near shoemaker": "sc_near_shoemaker",
//   Lucy: "sc_lucy",
//   Rosetta: "sc_rosetta",
//   "Osiris rex": "sc_osiris_rex",
//   "Osiris rex src": "sc_osiris_rex_src",
//   Philae: "sc_philae",
//   Psyche: "sc_psyche",
//   Stardust: "sc_stardust",
//   Stardust_src: "sc_stardust_src",
// };

// const celestialObjects = [
//   // Solar system
//   "sun",
//   // Planets
//   "mercury",
//   "venus",
//   "earth",
//   "mars",
//   "jupiter",
//   "saturn",
//   "uranus",
//   "neptune",
//   // Dwarf planets
//   "1_ceres",
//   // Asteroids
//   "101955_bennu",
//   "11351_leucus",
//   "15094_polymele",
//   "sc_psyche",
//   "162173_ryugu",
//   "21_lutetia",
//   "21900_orus",
//   "243_ida",
//   "25143_itokawa",
//   "253_mathilde",
//   "3548_eurybates",
//   "4_vesta",
//   "433_eros",
//   "52246_donaldjohanson",
//   "5535_annefrank",
//   "617_patroclus",
//   "617_patroclus_barycenter",
//   "65803_didymos",
//   "951_gaspra",
//   "9969_braille",
//   "99942_apophis",
//   "152830_dinkinesh",
//   // Moons
//   "dimorphos",
//   "menoetius",
//   "moon",
//   // Comets
//   "103p_hartley_2",
//   "9p_tempel_1",
//   "81p_wild_2",
//   "67p_churyumov_gerasimenko",
//   "19p_borrelly",
// ];

// const systems = {
//   "Inner Planets": "inner_solar_system",
//   "Outer Planets": "outer_solar_system",
//   "Earth Barycenter": "earth"
// }

// const spacecraft = {
//   // Galileo: "sc_galileo",
//   // Dart: "sc_dart",
//   // Dawn: "sc_dawn",
//   // "Deep impact": "sc_deep_impact",
//   // "Deep impact_impactor": "sc_deep_impact_impactor",
//   // "Deep space_1": "sc_deep_space_1",
//   // "Near shoemaker": "sc_near_shoemaker",
//   Lucy: "sc_lucy",
//   // Rosetta: "sc_rosetta",
//   "Osiris rex": "sc_osiris_rex",
//   // "Osiris rex src": "sc_osiris_rex_src",
//   // Philae: "sc_philae",
//   Psyche: "sc_psyche",
//   // Stardust: "sc_stardust",
//   // Stardust_src: "sc_stardust_src",
// }

// const broken = [
//   "134340_pluto", "136108_haumea", "136199_eris", "136472_makemake", "12923_zephyr",
//   "134340_pluto_barycenter", "14827_hypnos", "1566_icarus", "1620_geographos", "1862_apollo", 
//   "1981_midas", "1991_vg", "1993_hd", "1994_cc_a", "1996_xb27", "1998_ky26", "1998_ml14", "1998_qe2", 
//   "1999_ao10", "1999_cg9", "1999_vx25", "2_pallas", "2000_ae205", "2000_lg6", "2000_sg344", 
//   "2001_bb16", "2001_fr85", "2001_gp2", "2001_qj142", "2001_sn263_a", "2003_sm84", "2003_uv11", 
//   "2003_yn107", "2005_er95", "2005_lc", "2005_qp87", "2005_yu55", "2006_bz147", "2006_jy26", 
//   "2006_qq56", "2006_rh120", "2006_ub17", "2007_tf15", "2007_un12", "2007_vu6", "2008_bt2", 
//   "2008_cx118", "2008_ea9", "2008_el", "2008_hu4", "2008_jl24", "2008_kt", "2008_tc3", "2008_ts10", 
//   "2008_ua202", "2009_bd", "2009_os5", "2009_rt1", "2009_yf", "2010_an61", "2010_dj", "2010_jw34", 
//   "2010_tg19", "2010_tn167", "2010_ub", "2063_bacchus", "2101_adonis", "2102_tantalus", 
//   "2135_aristaeus", "216_kleopatra", "225088_2007_or10", "2340_hathor", "2867_steins", "3_juno", 
//   "3122_florence", "3200_phaethon", "3362_khufu", "367943_duende", "37655_illapa", 
//   "4015_wilson--harrington", "4179_toutatis", "4183_cuno", "4450_pan", "4486_mithra", "4769_castalia", 
//   "486958_arrokoth", "5011_ptah", "6239_minos", "6489_golevka", "66391_moshup", "69230_hermes", 
//   "90377_sedna", "charon", "hydra", "kerberos", "nix", "styx", "dactyl", "hiiaka", "namaka",
//   "adrastea", "amalthea", "callisto", "europa", "ganymede", "io", "metis", "thebe", "aitne", 
//   "ananke", "aoede", "arche", "autonoe", "callirrhoe", "carme", "carpo", "chaldene", "cyllene", 
//   "dia", "eirene", "elara", "erinome", "ersa", "euanthe", "eukelade", "eupheme", "euporie", 
//   "eurydome", "harpalyke", "hegemone", "helike", "hermippe", "herse", "himalia", "iocaste", 
//   "isonoe", "jupiter_li", "jupiter_lii", "jupiter_liv", "jupiter_lv", "jupiter_lvi", "jupiter_lix", 
//   "jupiter_lxi", "jupiter_lxiii", "jupiter_lxiv", "jupiter_lxvi", "jupiter_lxvii", "jupiter_lxviii", 
//   "jupiter_lxix", "jupiter_lxx", "jupiter_lxxii", "kale", "kallichore", "kalyke", "kore", "leda", 
//   "lysithea", "megaclite", "mneme", "orthosie", "pandia", "pasiphae", "pasithee", "philophrosyne", 
//   "praxidike", "s_2003_j_2", "s_2003_j_4", "s_2003_j_9", "s_2003_j_10", "s_2003_j_12", "s_2003_j_16", 
//   "s_2003_j_23", "s_2003_j_24", "s_2011_j_3", "s_2016_j_3", "s_2016_j_4", "s_2018_j_2", "s_2018_j_3", 
//   "s_2018_j_4", "s_2021_j_1", "s_2021_j_2", "s_2021_j_3", "s_2021_j_4", "s_2021_j_5", "s_2021_j_6", 
//   "s_2022_j_1", "s_2022_j_2", "s_2022_j_3", "sinope", "sponde", "taygete", "thelxinoe", "themisto", 
//   "thyone", "valetudo", "phobos", "deimos", "despina", "galatea", "halimede",
//   "hippocamp", "laomedeia", "larissa", "naiad", "nereid", "neso", "proteus", "psamathe", "sao", 
//   "thalassa", "triton", "dione", "enceladus", "hyperion", "iapetus", "mimas", "rhea", "tethys", 
//   "titan", "aegaeon", "aegir", "albiorix", "alvaldi", "angrboda", "anthe", "atlas", "bebhionn", 
//   "beli", "bergelmir", "bestla", "calypso", "daphnis", "eggther", "epimetheus", "erriapus", 
//   "farbauti", "fenrir", "fornjot", "geirrod", "gerd", "greip", "gridr", "gunnlod", "hati", 
//   "helene", "hyrrokkin", "ijiraq", "janus", "jarnsaxa", "kari", "kiviuq", "loge", "methone", 
//   "mundilfari", "narvi", "paaliaq", "pallene", "pan", "pandora", "phoebe", "polydeuces", 
//   "prometheus", "s_2004_s_7", "s_2004_s_12", "s_2004_s_13", "s_2004_s_17", "s_2004_s_21", 
//   "s_2004_s_24", "s_2004_s_28", "s_2004_s_31", "s_2004_s_36", "s_2004_s_37", "s_2004_s_39", 
//   "s_2006_s_1", "s_2006_s_3", "s_2007_s_2", "s_2007_s_3", "s_2009_s_1", "s_2019_s_1", "saturn_lviii", 
//   "saturn_lx", "saturn_lxiv", "siarnaq", "skathi", "skoll", "skrymir", "surtur", "suttungr", 
//   "tarqeq", "tarvos", "telesto", "thiazzi", "thrymr", "ymir", "s_2004_s_40", "s_2004_s_41", 
//   "s_2004_s_42", "s_2004_s_43", "s_2004_s_44", "s_2004_s_45",
//   "s_2004_s_46", "s_2004_s_47", "s_2004_s_48", "s_2004_s_49", "s_2004_s_50", "s_2004_s_51", 
//   "s_2004_s_52", "s_2004_s_53", "s_2005_s_4", "s_2005_s_5", "s_2006_s_10", "s_2006_s_11", 
//   "s_2006_s_12", "s_2006_s_13", "s_2006_s_14", "s_2006_s_15", "s_2006_s_16", "s_2006_s_17", 
//   "s_2006_s_18", "s_2006_s_19", "s_2006_s_20", "s_2006_s_9", "s_2007_s_5", "s_2007_s_6", "s_2007_s_7", 
//   "s_2007_s_8", "s_2007_s_9", "s_2019_s_10", "s_2019_s_11", "s_2019_s_12", "s_2019_s_13", 
//   "s_2019_s_14", "s_2019_s_15", "s_2019_s_16", "s_2019_s_17", "s_2019_s_18", "s_2019_s_19", 
//   "s_2019_s_2", "s_2019_s_20", "s_2019_s_21", "s_2019_s_3", "s_2019_s_4", "s_2019_s_5", "s_2019_s_6", 
//   "s_2019_s_7", "s_2019_s_8", "s_2019_s_9", "s_2020_s_1", "s_2020_s_10", "s_2020_s_2", "s_2020_s_3", 
//   "s_2020_s_4", "s_2020_s_5", "s_2020_s_6", "s_2020_s_7", "s_2020_s_8", "s_2020_s_9", "ariel", 
//   "miranda", "oberon", "titania", "umbriel", "belinda", "bianca", "caliban", "cordelia", 
//   "cressida", "cupid", "desdemona", "ferdinand", "francisco", "juliet", "mab", "margaret", 
//   "ophelia", "perdita", "portia", "prospero", "puck", "rosalind", "setebos", "stephano", "sycorax", 
//   "trinculo", "1i_oumuamua", "1p_halley", "c_1995_o1", "c_2010_x1", "c_2012_s1", "c_2013_a1", 
//   "c_2019_y4", "c_2020_f3", "sc_3d_winds", "sc_ace", "sc_acrimsat", "sc_aim", "sc_aqua", 
//   "sc_ascends", "sc_aura", "sc_c_nofs",
//   "sc_calipso", "sc_chandra", "sc_clarreo", "sc_cloudsat", "sc_cluster_ii_fm5", "sc_cluster_ii_fm6", 
//   "sc_cluster_ii_fm7", "sc_cluster_ii_fm8", "sc_cygnss_1", "sc_cygnss_2", "sc_cygnss_3", "sc_cygnss_4", 
//   "sc_cygnss_5", "sc_cygnss_6", "sc_cygnss_7", "sc_cygnss_8", "sc_dscovr", "sc_eo_1", "sc_explorer_1", 
//   "sc_face", "sc_fgrst", "sc_gacm", "sc_galex", "sc_geo_cape", "sc_geotail", "sc_goes_12", 
//   "sc_goes_13", "sc_goes_14", "sc_goes_15", "sc_gpm", "sc_grace_1", "sc_grace_2", "sc_grace_fo1", 
//   "sc_grace_fo2", "sc_grifex", "sc_hubble_space_telescope", "sc_hyspiri", "sc_ibex", "sc_icesat_2", 
//   "sc_image", "sc_integral", "sc_ipex", "sc_isas", "sc_iss", "sc_iss_ecostress", "sc_iss_emit", 
//   "sc_iss_oco_3", "sc_iss_rapidscat", "sc_ixpe", "sc_jason_1", "sc_jason_2", "sc_jason_3", "sc_jwst", 
//   "sc_landsat_5", "sc_landsat_7", "sc_landsat_8", "sc_landsat_9", "sc_list", "sc_m_cubed", 
//   "sc_mcubed_2", "sc_mms_1", "sc_mms_2", "sc_mms_3", "sc_mms_4", "sc_nisar", "sc_noaa_14", 
//   "sc_noaa_15", "sc_noaa_16", "sc_noaa_17", "sc_noaa_18", "sc_noaa_19", "sc_nustar", "sc_oco_2", 
//   "sc_path", "sc_polar", "sc_quikscat", "sc_race", "sc_raincube", "sc_rax_2", "sc_rbsp_a", 
//   "sc_rbsp_b", "sc_sac_d", "sc_sclp", "sc_sdo", "sc_sentinel_6", "sc_smap", "sc_soho", "sc_sorce", 
//   "sc_starling_1", "sc_starling_2", "sc_starling_3", "sc_starling_4", "sc_suomi_npp", "sc_swift", 
//   "sc_swot", "sc_tdrs_3", "sc_tdrs_5", "sc_tdrs_6", "sc_tdrs_7", "sc_tdrs_8",
//   "sc_tdrs_9", "sc_tdrs_10", "sc_tdrs_11", "sc_tdrs_12", "sc_tdrs_13", "sc_terra", "sc_tess", 
//   "sc_themis_a", "sc_themis_d", "sc_themis_e", "sc_timed", "sc_trmm", "sc_uars", "sc_wind", 
//   "sc_wise", "sc_apollo_15", "sc_artemis_1", "sc_capstone", "sc_clementine", "sc_grail_a", 
//   "sc_grail_b", "sc_ladee", "sc_lcross", "sc_lcross_impact_site", "sc_lunar_flashlight", 
//   "sc_lunar_icecube", "sc_lunar_prospector", "sc_lunar_reconnaissance_orbiter", "sc_smart_1", 
//   "sc_themis_b", "sc_themis_c", "sc_mars_2020", "sc_mars_2020_landing_site", "sc_mars_science_laboratory", 
//   "sc_mars_science_laboratory_landing_site", "sc_mars_exploration_rover_1", 
//   "sc_mars_exploration_rover_1_landing_site", "sc_mars_exploration_rover_2", 
//   "sc_mars_exploration_rover_2_landing_site", "sc_insight", "sc_insight_landing_site", "sc_marco_a", 
//   "sc_marco_b", "sc_mars_odyssey", "sc_mars_reconnaissance_orbiter", "sc_maven", "sc_mars_express", 
//   "sc_phoenix", "sc_phoenix_landing_site", "sc_trace_gas_orbiter", "sc_mars_orbiter_mission", 
//   "sc_mars_global_surveyor", "sc_mars_climate_orbiter", "sc_mars_pathfinder", 
//   "sc_mars_pathfinder_landing_site", "sc_mars_polar_lander", "sc_viking_1_orbiter", 
//   "sc_viking_1_lander_landing_site", "sc_viking_2_orbiter", "sc_viking_2_lander_landing_site", 
//   "sc_messenger", "sc_messenger_impact_site", "sc_juno", "sc_cassini", "sc_europa_clipper", 
//   "sc_galileo_probe", "sc_huygens", "sc_huygens_landing_site", "sc_juice", "sc_pioneer_10", 
//   "sc_pioneer_11", "sc_voyager_1", "sc_voyager_2", "sc_deep_impact_impactor_impact_site", 
//   "sc_near_shoemaker_landing_site", "sc_new_horizons", "sc_rosetta_impact_site", "sc_philae_landing_site", 
//   "sc_biosentinel", "sc_kepler_space_telescope", "sc_mariner_2", "sc_parker_solar_probe", "sc_spitzer", 
//   "sc_stereo_ahead", "sc_stereo_behind", "sc_ulysses", "sc_wmap", "sc_magellan", "sc_venus_express", 
//   "rose_bowl", "school_bus", "scientist",
// ];


let a, b = null;

async function initDevTools() {
  document.addEventListener("keydown", devShortcuts);
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let entityIndex = 0;
let newBroken = [];
let newWorking = [];

async function devShortcuts(event) {
  if (event.key === ' ') {
    getEmAll();
  }
  if (event.key === '2') {
    learn();
  }
  if (event.key === '1') {
    watch();
  }
  if (event.key === '3') {
    filters();
  }
  if (event.key === '4') {
    showAsteroids(true);
  }
  if (event.key === '5') {
    showComets(true);
  }
  if (event.key === '6') {
    showPHOs(true);
  }
  if (event.key === '7') {
    showAsteroids(false);
  }
  if (event.key === '8') {
    showComets(false);
  }
  if (event.key === '9') {
    showPHOs(false);
  }
  if (event.key === '0') {
    resetFilters();
  }
  if (event.key === 'j') {
    setTimeRate(-1);
  }
  if (event.key === 'k') {
    showPHOs(false);
  }
  if (event.key === 'l') {
    live();
  }
  if (event.key === 'u') {
    toggleLayer("ui")
  }
  if (event.key === 'm') {
    minimizeWatch()
  }
  if (event.key == 'v') {
    startStoryAsteroids();
  }
  if (event.key == 'b') {
    startStoryCloseApproaches();
  }
  if (event.key == 'n') {
    startStoryMissions();
  }
  if (event.key == '\'') {
    closeStory();
  }
  if (event.key == '[') {
    prevSlide();
  }
  if (event.key == ']') {
    nextSlide();
  }
}

async function getEmAll() {
  if (entityIndex >= spacecraft.length) {
    console.log("ALL DONE");
    console.log(newBroken);
    console.log(newWorking);
    return;
  }
  let celObj = Object.values(spacecraft)[entityIndex];
  try {
    console.log(celObj);
    await flyToSpacecraft(celObj);
    newWorking.push(celObj)
  } catch {
    // console.log("NOPE");
    newBroken.push(celObj);
  }
  entityIndex++;
}

initDevTools();