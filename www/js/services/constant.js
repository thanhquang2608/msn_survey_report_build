'use strict';
surveyReportApp.constant('AUTH_EVENTS', {
    authenticated: 'authenticated',
    logout: 'logout',
    notAuthenticated: 'auth-not-authenticated',
    notAuthorized: 'auth-not-authorized'
})

.constant('NETWORK_EVENTS', {
    nointernet: 'nointernet',
    timeout: 'timeout'
})

.constant('STORAGE_KEYS', {
    list_dealers: 'AncoListDealersKey',
    token_key: 'AncoTokenKey',
    user_key: 'AncoUserKey',
    appversion_key: 'AppVersionKey',
    last_provinceid_selected: 'LastIdProvinceSelected'
})

.constant('USER_ROLES', {
    admin: 'admin_role',
    public: 'public_role'
})

.constant('NETWORK', {
    // BASE_URL: 'http://192.168.1.69:1337'
    BASE_URL: 'http://survey-anco.rhcloud.com',
    API_URL: 'http://server-tintmmasanreport.rhcloud.com/'
    //BASE_URL: 'http://server-tintmanco.rhcloud.com'
    // BASE_URL: 'http://localhost:1337'
    //BASE_URL: 'http://server-masandev.rhcloud.com'
})

.constant('REGIONS', {
    '-1': { id: 'all', fullname: 'Tất Cả', name: 'Cả Nước' },
    '100': { id: 100, fullname: 'Miền Tây', name: 'M.Tây' },
    '101': { id: 101, fullname: 'Miền Đông & HCM', name: 'M.Đông' },
    '103': { id: 103, fullname: 'Miền Trung & Cao Nguyên', name: 'M.Trung' },
    '104': { id: 104, fullname: 'Nam Sông Hồng', name: 'NSH' },
    '105': { id: 105, fullname: 'Bắc Sông Hồng', name: 'BSH' },
})

.constant('COMPANIES', {
    '-1': { id: 'all', name: "Tổng" },
    'AC': { id: 1, name: "ANCO" },
    'CC': { id: 2, name: "CONCO" },
    'CP': { id: 3, name: "CP" },
    'CG': { id: 4, name: "CARGRILL" },
    'GF': { id: 5, name: "GREENFEED" },
    'O': { id: 6, name: "KHÁC" }
})

.constant('PRODUCTS', [
                        { id: 'all', name: "Tất Cả" },
                        { id: 'heo', name: "Heo" },
                        { id: 'bo', name: "Bò" },
                        { id: 'ga', name: "Gà" },
                        { id: 'vit', name: "Vịt" },
])

.constant('TOPS', [
    { id: 10, name: '10' },
    { id: 30, name: '30' },
    { id: 50, name: '50' },
    { id: 100, name: '100' }
])


.constant('USERS', {
    NSM: 'NSM',
    RSM: 'RSM',
    ASM: 'ASM',
    SUPERVISOR: 'SupRep',
})

.constant('ROLES', {
    1: 'SUPERVISOR',
    2: 'SUPERVISOR',
    3: 'ASM',
    4: 'RSM',
    5: 'NSM',
})

.constant('BRANDS', {
    'AC_AC': 'ANCO',
    'AC_AM':  'A&M',
    'AC_GN':  'GUINNESS',

    // 'CG': 'CARGILL',
    // 'CP': 'CP',

    // 'DB': 'DABACO',
    // 'DH' : 'DEHUES',
    // 'GF': 'GREEN FEED',
  
    // 'JF': "JAPFA",
    // 'LT': "LÁI THIÊU",
    // 'NH': "NEW HOPE",
    // 'UP': 'UP',

    'CC_CC' : 'CONCO',
    'CC_PC' : 'FORCY',
    'CC_AM' : 'AMI',
    'CC_BO' : 'BIG ONE',
    'CC_SM' : 'SUMO',
    'CC_DL' : 'DELICE',
    'CC_FF': 'FRANCE FEED',
    // 'CC_O': 'Khác',
})
