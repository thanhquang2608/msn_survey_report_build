'use strict';
surveyReportApp
.service('ShowReportSurveyAPI', function ($http, NETWORK, $rootScope, $q, REGIONS, USERS, ROLES, PRODUCTS, COMPANIES, AuthService) {
    var serviceBase = NETWORK.API_URL;
    $rootScope.user_info = null;

    // service init
    function init() {
        if (!$rootScope.brands) {
            getBrands().then(function (response) {
                $rootScope.brands = response;
            });
        }

        if (!$rootScope.user_info) {
            $rootScope.user_info = getUserInfo();

            return getUserRegion($rootScope.user_info.id, $rootScope.user_info.company_name).then(function (response) {
                $rootScope.user_info.regions = response;
            });
        }

        return $q(function (resolve, reject) {
            resolve();
        });
    }

    // general function, post and get
    // function to get data from server by get
    function CallGetMethod(URL, transition_func) {
        return $http.get(URL, { timeout: $rootScope.TIME_OUT })
            .then(function successCallback(response) {
                //translate the response data to data format
                // return promise
                return transition_func(response.data);
            }, function errorCallback(response) {
                if (response.status != 0 && response.status != 408) {
                    console.log("get data failed, statusCode: " + response.status);
                    return transition_func(null);
                }
            });
    }

    // function to get data from server by post
    function CallPostMethod(URL, param, config, transition_func) {
        return $http.post(URL, param, config)
            .then(function successCallback(response) {
                //translate the response data to data format
                // return promise
                return transition_func(response.data);
            }, function errorCallback(response) {
                if (response.status != 0 && response.status != 408) {
                    console.log("get data failed, statusCode: " + response.status);
                    return transition_func(null);
                }
            });
    }

    // get user region
    function getUserRegion(user_id, company) {
        return CallGetMethod(serviceBase + '/salerep/' + user_id + '/company/' + company, function (rawData) {
            var resData = rawData.response;
            if (!resData || typeof resData === 'undefined' || resData.length == 0) {
                return [{ id: -1, name: 'Không có dữ liệu.' }];
            }
            var regions = [];
            angular.forEach(resData, function (val, k) {
                regions.push({ id: val.RegionId, name: val.RegionName });
            });
            return regions;
        });
    }

    // format user info
    function getUserInfo() {

        var user = AuthService.user();
        var provinces = [];

        angular.forEach(user.Provinces, function (val, k) {
            provinces.push({ id: val.ProvinceId, name: val.ProvinceName });
        });


        var user_info = {
            id: user.SaleRepId,
            name: user.SaleName,
            company: user.AC_PC,
            company_name: user.AC_PC ? 'conco' : 'anco',
            role: null,
            regions: null,
            provinces: provinces,
        }

        if (user.RoleId)
            user_info.role = USERS[ROLES[user.RoleId]];
        else {
            user_info.role = USERS.SUPERVISOR;
        }

        return user_info;
    }

    // clear user info
    function clearUserInfo() {
        $rootScope.user_info = null;
    }

    // Báo cáo
    // get brands
    function getBrands() {
        return CallGetMethod(serviceBase + '/brands', function (rawData) {
            var data = {};
            if (rawData) {
                data["-1"] = { id: 'all', name: "Tổng" };
                for (var i = 0; i < rawData.length; i++) {
                    data[rawData[i].brand_id] = { id: rawData[i].brand_id, name: rawData[i].brand_name };
                }
            } else {
                return COMPANIES;
            }
            return data;
        });
    }

    //get list of product based on chosen company
    function getProduct(company) {
        return PRODUCTS;
    }

    //get list of Region to show
    function getRegion() {
        switch ($rootScope.user_info.role) {
            case USERS.SUPERVISOR:
            case USERS.ASM:
                return $q(function (resolve, reject) {
                    if ($rootScope.user_info.regions) {
                        resolve($rootScope.user_info.regions);
                    } else {
                        reject([{ id: -1, name: 'Không có dữ liệu.' }]);
                    }
                });
                break;
            case USERS.RSM:
            case USERS.NSM:
                return CallGetMethod(serviceBase + '/regions', function (rawData) {
                    //Format:
                    //{ id: id of region, 
                    //  name: name of the region }

                    if (!rawData)
                        return [{ id: -1, name: 'Không có dữ liệu.' }];

                    var data = [];

                    var resData = rawData.response;

                    data.push({ id: "all", name: "Cả Nước" });

                    for (var index = 0; index < resData.length; ++index) {
                        data.push({ id: resData[index].RegionId, name: resData[index].RegionName });
                    }

                    return data;
                });
        }
    }

    //get all province in one region
    function getProvince(region_id, company) {
        switch ($rootScope.user_info.role) {
            case USERS.SUPERVISOR:
                return $q(function (resolve, reject) {
                    if ($rootScope.user_info.regions.length === 1 && $rootScope.user_info.provinces) {
                        resolve($rootScope.user_info.provinces);
                    } else {
                        reject([{ id: -1, name: 'Không có dữ liệu.' }]);
                    }
                });
                break;
            case USERS.ASM:
            case USERS.RSM:
            case USERS.NSM:
                return CallGetMethod(serviceBase + '/regions/' + region_id + '/provinces/company/' + company, function (rawData) {
                    //Format:
                    //{ id: id of province, 
                    //  name: name of the province }

                    if (!rawData)
                        return [{ id: -1, name: 'Không có dữ liệu.' }];

                    var data = [];

                    var resData = rawData.response;

                    data.push({ id: "all", name: "Tất Cả", region: region_id });

                    for (var index = 0; index < resData.length; ++index) {
                        data.push({ id: resData[index].ProvinceId, name: resData[index].ProvinceName });
                    }

                    return data;
                });
        }

    }


    //get all district from one province
    function getRuralDistrict(province_id) {
        return CallGetMethod(serviceBase + '/provinces/' + province_id + '/districts', function (rawData) {
            //Format:
            //{ id: id of district, 
            //  name: name of the District }

            var data = [];

            var resData = rawData.response;

            data.push({ id: "all", name: "Tất Cả" });

            for (var index = 0; index < resData.length; ++index) {
                data.push({ id: resData[index].DistrictId, name: resData[index].DistrictName });
            }

            return data;
        });
    }

    //get all commune from one district
    function getRuralCommunes(district_id) {
        return CallGetMethod(serviceBase + '/districts/' + district_id + '/wards/', function (rawData) {
            //Format:
            //{ id: id of commune, 
            //  name: name of the commune }

            var data = [];

            var resData = rawData.response;

            data.push({ id: "all", name: "Tất Cả" });

            for (var index = 0; index < resData.length; ++index) {
                data.push({ id: resData[index].WardId, name: resData[index].WardName });
            }

            return data;
        });
    }

    $rootScope.numberWithCommas = function (x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }

    // format yield data
    function formatYieldData(rawData) {
        /*
        - following format:
         data = {first_row: first row of data,
         first_column: first column of data,
         data:[{id: row's id, name: row's name, 
                data: [{id: column's id, percentage: %, number: #}
                        ...]
               }
               ....
              ]
        }
        */

        // get data
        var resData = rawData.response;
        // check data
        if (!resData || typeof resData === 'undefined' || resData.length == 0) {
            return { first_row: null, first_column: null, data: [{ id: 1, name: "Không có dữ liệu" }] };
        }


        var first_row = [];
        var first_column = [];
        var data = [];
        var template_data = [];
        var template_index = [];
        // get the total of the data
        var temp;
        var total = [];
        for (var i = 0; i < resData.length; i++) {

            if (resData[i].name === "Tổng") {
                temp = resData[i].data;
                break;
            }
        }
        
        var type;
        var type_value;
        var index = 1;
        if (temp[0].company) {
            type = 'company';
            type_value = $rootScope.brands;
        }
        else {
            type = 'region';
            type_value = REGIONS;
        }

        // get first row
        angular.forEach(temp, function (value, key) {
            if (value[type] === -1) {
                total.unshift(value);
                first_row.unshift(type_value[value[type]]);
                template_data.unshift({ id: value[type], percentage: '0.00%', number: 0 });
                template_index[value[type]] = 0;
            }
            else {
                if (value[type] === 'ANCO')
                    value[type] = 'AC';
                total.push(value);
                first_row.push(type_value[value[type]]);
                template_data.push({ id: value[type], percentage: '0.00%', number: 0 });
                template_index[value[type]] = index++;
            }
        });
        
        // format the data
        angular.forEach(resData, function (row, key) {
            // get the first column
            first_column.push({ id: key, name: row.name });

            // format the data
            var curRow = row.data;
            temp = { id: key, name: row.name, data: [] };
            angular.copy(template_data, temp.data);

            angular.forEach(curRow, function (val, k) {
                var dataTemp = temp.data[template_index[val[type]]];
                var totalTemp = total[template_index[val[type]]];

                var percent = totalTemp.yield == 0 ? 0 : (val.yield / totalTemp.yield) * 100;
                percent = percent.toFixed(2) + '%';

                dataTemp.percentage = percent;
                dataTemp.number = $rootScope.numberWithCommas(val.yield);
            });
            if (temp.name === "Tổng")
                data.unshift(temp);
            else
                data.push(temp);
        });
        return { first_row: first_row, first_column: first_column, data: data };
    }

    // format data for ward 
    function formatWardYieldData(rawData) {

        /*
        - following format:
         data = {first_row: first row of data,
         first_column: first column of data,
         data:[{id: row's id, name: row's name, 
                data: [{id: column's id, percentage: %, number: #}
                        ...]
               }
               ....
              ]
        }
        */

        // get data
        var resData = rawData.response;

        // check data
        if (!resData || typeof resData === 'undefined' || resData.length == 0) {
            return { first_row: null, first_column: null, data: [{ id: 1, name: "Không có dữ liệu" }] };
        }

        var brands = $rootScope.brands;
        var first_row = [];
        var first_column = [];
        var data = [];
        var temp;

        // get the total of the data
        var total;
        for (var i = 0; i < resData.length; i++) {
            if (resData[i].companyname) {
                total = resData[i].yield;
                break;
            }
        }

        // format the data
        temp = { id: 0, name: "Sản lượng", data: [] };
        angular.forEach(resData, function (val, key) {
            var percent = !total ? 0 : (val.yield / total) * 100;
            percent = percent.toFixed(2) + '%';

            if (val.companyname) {
                first_row.unshift(brands[val.companyname]);
                temp.data.unshift({ id: val.companyname, percentage: percent, number: $rootScope.numberWithCommas(val.yield) });
            }
            else {
                first_row.push(brands[val.company]);
                temp.data.push({ id: val.company, percentage: percent, number: $rootScope.numberWithCommas(val.yield) });
            }
        });
        data.push(temp);
        return { first_row: first_row, first_column: null, data: data };
    }

    // get yield data
    function getYieldData(selectedOption) {
        // basic URL for yield
        var URL = serviceBase + '/yield';

        // add region
        URL += '/regions/' + selectedOption.region;

        if (selectedOption.province) {
            // add provinces
            URL += '/provinces/' + selectedOption.province;

            if (selectedOption.district) {
                // add district
                URL += '/districts/' + selectedOption.district;

                if (selectedOption.ward) {
                    // add ward
                    URL += '/wards/' + selectedOption.ward;
                }
            }
        }

        //if (selectedOption.company === 'all') {
        //    var anco = URL += '/products/' + selectedOption.product + '/buy/' + selectedOption.dealer + '/company/anco';
        //    var conco = URL += '/products/' + selectedOption.product + '/buy/' + selectedOption.dealer + '/company/conco';
        //    var promises;

        //    // call get data
        //    if (selectedOption.ward)
        //        promises = [CallGetMethod(anco, formatWardYieldData), CallGetMethod(conco, formatWardYieldData)];
        //    else
        //        promises = [CallGetMethod(anco, formatYieldData), CallGetMethod(conco, formatYieldData)];

        //    $q.all(promises).then(function(response){
                
        //    });

        //} else {
            URL += '/products/' + selectedOption.product + '/buy/' + selectedOption.dealer + '/company/' + selectedOption.company;

            // call get data
            if (selectedOption.ward)
                return CallGetMethod(URL, formatWardYieldData);
            else
                return CallGetMethod(URL, formatYieldData);
        //}
    }

    // Bản đồ đại lý
    // format agency data
    function formatAgencyLocationData(rawData) {
        if (!rawData)
            return null;

        var data = [];

        var resData = rawData.response;
        //for all agency
        for (var index = 0; index < resData.length; ++index) {
            //for all survey in that agency
            for (var j = 0; j < resData[index].surveys.length; ++j) {
                var agency =
                {
                    id: resData[index].dealer_id,
                    code: resData[index].dealer_code,
                    location: {},
                    title: resData[index].dealer_name,
                    address: resData[index].dealer_address,
                    company: resData[index].Company,
                };

                var survey = resData[index].surveys[j]
                agency.location = {
                    id: survey.survey_id,
                    latitude: survey.survey_lat,
                    longtitude: survey.survey_long,
                };
                //add
                data.push(agency);
            }
        }

        return data;
    }

    //get agency at some regions
    function getAgencyAtRegion(region, company) {
        return CallGetMethod(serviceBase + '/dealer/regions/' + region + '/company/' + company, formatAgencyLocationData);
    }

    // get agency at some provinces
    function getAgencyAtProvince(province, company) {
        return CallGetMethod(serviceBase + '/dealer/provinces/' + province + '/company/' + company, formatAgencyLocationData);
    }

    //get agency at some districts
    function getAgencyAtDistrict(district, company) {
        return CallGetMethod(serviceBase + '/dealer/districts/' + district + '/company/' + company, formatAgencyLocationData);
    }

    //get agency at some wards
    function getAgencyAtWard(ward, company) {
        return CallGetMethod(serviceBase + '/dealer/wards/' + ward + '/company/' + company, formatAgencyLocationData);
    }


    // get Agency area defend on user rank
    function getAgencyAtArea(area_name, areas, company) {

        //link these area id together Ex: 103+102+100...
        var area_str = areas[0].id;

        for (var index = 1; index < areas.length; ++index) {
            area_str = area_str + '+' + areas[index].id;
        }


        if (area_name === "region") {
            return getAgencyAtRegion(area_str, company);
        }
        else if (area_name === "province") {
            return getAgencyAtProvince(area_str, company);
        }
        else if (area_name === "district") {
            return getAgencyAtDistrict(area_str, company);
        }
        else if (area_name === "ward") {
            return getAgencyAtWard(area_str, company);
        }


    }

    //get list of location of agency
    function getAgencyLocation(filter_option) {

        var agencyLocation;
        var user = $rootScope.user_info;
        var role = user.role;
        var company = user.company_name;
        var regions = [
            { id: 100, name: 'Miền Tây' },
            { id: 101, name: 'Miền Đông & HCM' },
            { id: 103, name: 'Miền Trung & Cao Nguyên' },
            { id: 104, name: 'Nam Sông Hồng' },
            { id: 105, name: 'Bắc Sông Hồng' },
        ]

        if (filter_option.is_store) {
            var company = filter_option.company.GetCompanyName();
            if (filter_option.level.code !== "T")
                agencyLocation = getAgencyAtRegion(filter_option.area.id, company);
            else
                agencyLocation = getAgencyAtProvince(filter_option.area.id, company);
        }
        else {

            switch (role) {
                case USERS.NSM:
                    //National user view every region
                case USERS.RSM:
                    //region user can choose region
                    agencyLocation = getAgencyAtRegion(user.regions[0].id, company);
                    break;
                case USERS.ASM:
                    //ASM can choose Province

                case USERS.SUPERVISOR:
                    //SUPERVISOR can choose Province
                    agencyLocation = getAgencyAtProvince(user.provinces[0].id, company);
                    break;
            }

        }


        return agencyLocation;
    }

    // get dealers report
    function getDealerReport(dealer_list) {
        var param = $.param({ data: dealer_list });

        var config = {
            timeout: $rootScope.TIME_OUT,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }

        return CallPostMethod(serviceBase + '/dealer/report', param, config, function (resData) {
            var data = [];
            angular.forEach(resData, function (val, k) {
                var total = val.yield.heo.TOTAL + val.yield.bo.TOTAL + val.yield.ga.TOTAL + val.yield.vit.TOTAL;
                data.push({ id: val.dealer_id, weight: total });
            });
            return data;
        });
    }

    function getTopDealer(product, brand, condition, detail, company, offset, buy) {
        return CallGetMethod(serviceBase + '/dealer/report/products/' + product + '/brands/' + brand
                              + '/conditions/' + condition + '/details/' + detail + '/buy/' + buy
                              + '/company/' + company + '/offset/' + offset, function (rawData) {
                                  //Format:
                                  //{ id: id of province, 
                                  //  name: name of the province }


                                  var resData = rawData.response;

                                  var data = [];

                                  for (var index = 0; index < resData.length; ++index) {
                                      var res = resData[index];
                                      var is_indirect;
                                      if (res.Company == 0)
                                          is_indirect = res.GT_AC;
                                      else if (res.Company == 1)
                                          is_indirect = res.GT_CC;

                                      if (is_indirect == 0) is_indirect = "X"
                                      else
                                          is_indirect = "";
                                      data.push({
                                          'rank': index + 1, 'id': res.DealerId, 'name': res.DealerName
                                                  , 'address': res.Address, 'yield': res.sanluong, 'is_direct': is_indirect
                                      });

                                  }
                                  return data;
                              });

    }
    return {
        IsInit: function () { return isInited; },
        Init: init,
        GetProduct: getProduct,
        GetRegion: getRegion,
        GetProvince: getProvince,
        GetRuralDistrict: getRuralDistrict,
        GetRuralCommunes: getRuralCommunes,
        GetAgencyLocation: getAgencyLocation,
        GetUserInfo: function () { return $rootScope.user_info; },
        GetYieldData: getYieldData,
        GetDealerReport: getDealerReport,
        GetBrands: getBrands,
        ClearUserInfo: clearUserInfo,
        GetTopDealer: getTopDealer,
    };
}).service('RegionMapService', function (NETWORK, $rootScope, $q, $http, ShowReportSurveyAPI, USERS) {
    var serviceBase = NETWORK.API_URL;

    // general function, post and get
    // function to get data from server by get
    function CallGetMethod(URL, transition_func) {
        return $http.get(URL, { timeout: $rootScope.TIME_OUT })
            .then(function successCallback(response) {
                //translate the response data to data format
                // return promise
                return transition_func(response.data);
            }, function errorCallback(response) {
                if (response.status != 0 && response.status != 408) {
                    console.log("get data failed, statusCode: " + response.status);
                    return transition_func(null);
                }
            });
    }

    function CallGetMethod_Map(URL, param, transition_func) {
        return $http.get(URL, { timeout: $rootScope.TIME_OUT })
            .then(function successCallback(response) {
                //translate the response data to data format
                // return promise
                return transition_func(response.data, param);
            }, function errorCallback(response) {
                if (response.status != 0 && response.status != 408) {
                    console.log("get data failed, statusCode: " + response.status);
                    return transition_func(null, null);
                }
            });
    }

    function loadGeoJson() {
        return CallGetMethod('./vngeojson/VNM_provinces.geojson', function (response) {
            return response;
        });
    }

    // Vùng Chăn nuôi
    // Get vietnam geojson
    function loadProvincesBoundary(provinces_list) {
        return CallGetMethod('./vngeojson/provinces_boundary.json', function (response) {
            if (provinces_list) {
                var result = { index: {}, data: [] };
                var index = 0;
                angular.forEach(provinces_list, function (val, k) {
                    var _id = val.id;
                    if (response[_id]) {
                        result.index[_id] = index;
                        result.data.push(response[_id]);
                    }
                });
                return result;
            }
            else
                return response;
        });
    }

    function loadDistrictsBoundary(district_list) {
        return CallGetMethod('./vngeojson/districts_boundary.json', function (response) {
            if (district_list) {
                var result = { index: {}, data: [] };
                var index = 0;
                angular.forEach(district_list, function (val, k) {
                    var _id = val.id;
                    if (response[_id]) {
                        result.index[_id] = index;
                        result.data.push(response[_id]);
                    }
                });
                return result;
            }
            else
                return response;
        });
    }

    function loadWardsBoundary(wards_list) {
        return CallGetMethod('./vngeojson/wards_boundary.json', function (response) {
            if (wards_list) {
                var result = { index: {}, data: [] };
                var index = 0;
                angular.forEach(wards_list, function (val, k) {
                    var _id = val.id;
                    if (response[_id]) {
                        result.index[_id] = index;
                        result.data.push(response[_id]);
                    }
                });
                return result;
            }
            else
                return response;
        });
    }

    function getMapProvinceIndex(region_id, company) {
        return CallGetMethod(serviceBase + '/regions/' + region_id + '/provinces/company/' + company, function (rawData) {

            var resData = rawData.response;
            var data = { index: {}, provinces: [] };

            angular.forEach(resData, function (val, k) {
                data[val.ProvinceName] = val.ProvinceId;
            });

            return data;
        });
    }

    function formatMapData(rawData, provinces_index) {
        var resData = rawData.response;
        var result = { index: {}, max: 0, min: 9999999, data: [] };
        var brands = $rootScope.brands;


        angular.forEach(resData, function (province, k) {
            var id = provinces_index[province.name];
            if (id) {
                result.index[id] = k;
                result.data[k] = { id: id, detail: [] }

                angular.forEach(province.data, function (pdata, dk) {
                    if (brands[pdata.company].id !== 'all')
                        result.data[k].detail.push({ id: brands[pdata.company].id, name: brands[pdata.company].name, 'yield': pdata.yield });
                    else {
                        result.data[k].detail.unshift({ id: brands[pdata.company].id, name: brands[pdata.company].name, 'yield': pdata.yield });

                        if (result.max < pdata.yield)
                            result.max = pdata.yield;
                        if (result.min > pdata.yield)
                            result.min = pdata.yield;
                    }
                });
            }
        });

        return result;
    }

    function getProvinceData(regions) {
        var promises = [];
        var company = $rootScope.user_info.company_name;
        if ($rootScope.user_info.role === USERS.NSM) {
            company = 'all';
        }

        angular.forEach(regions, function (region, k) {
            if (region.id !== 'all') {
                promises.push(getMapProvinceIndex(region.id, company).then(function (provinces_index) {
                    return CallGetMethod_Map(serviceBase + '/yield/regions/' + region.id + '/products/all/buy/all/company/' + company, provinces_index, formatMapData);
                }));
            }
        });

        return promises;
    }

    function getDistrictData(provinces_list) {

    }

    function getWardData(districts_list) {

    }

    function getMapData(type, params) {
        switch (type) {
            case 'P':
                return ShowReportSurveyAPI.GetRegion().then(function (regions) {
                    return getProvinceData(regions);
                });
                break;
            case 'D':
                company = $rootScope.user_info.company_name;
                return ShowReportSurveyAPI.GetProvince().then(function (regions) {
                    return getDistrictData(regions);
                });
                break;
            case 'W':
                break;
        }
    }

    return {
        LoadGeoJson: loadGeoJson,
        LoadProvincesBoundary: loadProvincesBoundary,
        LoadDistrictsBoundary: loadDistrictsBoundary,
        LoadWardsBoundary: loadWardsBoundary,
        GetMapData: getMapData,
    }
})
.service('ReportSurveyOptionCache', function ($rootScope, USERS) {
    var IS_CACHED = false;
    var PRODUCTS_CACHE;
    var DEALERS_CACHE;
    var REGIONS_CACHE;
    var PROVINCES_CACHE;
    var DISTRICTS_CACHE;
    var COMMUNES_CACHE;
    //default value
    var SELECTED_OPTION_CACHE = {
        product: { id: 'all', name: "Tất Cả" },
        company: {
            anco: false,
            conco: false,
            GetCompanyName: function () {
                if (this.anco && this.conco)
                    return ('all');
                else if (!this.anco)
                    return ('conco');
                else if (!this.conco);
                return ('anco');
            }
        },
        dealer: { direct: true, indirect: true },
        region: { id: 'all', name: "Cả Nước" },
        province: { id: 'all', name: "Tất Cả" },
        rural_district: { id: 'all', name: "Tất Cả" },
        rural_commune: { id: 'all', name: "Tất Cả" },

        top: { id: 100, name: "100" },
        brand: { id: 'AC', name: "ANCO" },
    };

    if (!IS_CACHED) {
        switch ($rootScope.user_info.role) {
            case USERS.SUPERVISOR:
            case USERS.ASM:
            case USERS.RSM:
                if (!$rootScope.user_info.company)
                    SELECTED_OPTION_CACHE.company.anco = true;
                else
                    SELECTED_OPTION_CACHE.company.conco = true;
                break;
            case USERS.NSM:
                SELECTED_OPTION_CACHE.company.anco = true;
                SELECTED_OPTION_CACHE.company.conco = true;
        }
    }

    function getProductList() {
        return PRODUCTS_CACHE;
    }

    function getDealerList() {
        return DEALERS_CACHE;
    }

    function getRegionList() {
        return REGIONS_CACHE;
    }

    function getProvinceList() {
        return PROVINCES_CACHE;
    }

    function getDistrictList() {
        return DISTRICTS_CACHE;
    }

    function getCommuneList() {
        return COMMUNES_CACHE;
    }

    function getSelectedOption() {
        return SELECTED_OPTION_CACHE;
    }

    function CacheProduct(products) {
        PRODUCTS_CACHE = products;
    }

    function CacheDealer(dealers) {
        DEALERS_CACHE = dealers;
    }

    function CacheRegion(regions) {
        REGIONS_CACHE = regions;
    }

    function CacheProvince(provinces) {
        PROVINCES_CACHE = provinces;
    }

    function CacheDistrict(districts) {
        DISTRICTS_CACHE = districts;
    }

    function CacheCommune(communes) {
        COMMUNES_CACHE = communes;
    }

    function CacheSelectedOption(selected) {
        SELECTED_OPTION_CACHE = selected;
    }

    function setCacheStatus(status) {
        IS_CACHED = status;
    }

    function CacheStatus() {
        return IS_CACHED;
    }

    return {
        SetCacheStatus: setCacheStatus,
        CacheStatus: CacheStatus,
        GetProductList: getProductList,
        GetDealerList: getDealerList,
        GetRegionList: getRegionList,
        GetProvinceList: getProvinceList,
        GetDistrictList: getDistrictList,
        GetCommuneList: getCommuneList,
        GetSelectedOption: getSelectedOption,
        CacheProduct: CacheProduct,
        CacheDealer: CacheDealer,
        CacheRegion: CacheRegion,
        CacheProvince: CacheProvince,
        CacheDistrict: CacheDistrict,
        CacheCommune: CacheCommune,
        CacheSelectedOption: CacheSelectedOption,
    };
})

.service('ReportSurveyTopDealerOptionCache', function () {
    //default value
    var SELECTED_OPTION_CACHE = {
        product: { id: 'heo', name: "Heo" },
        company: {
            anco: false,
            conco: false,
            GetCompanyName: function () {
                if (this.anco && this.conco)
                    return ('all');
                else if (!this.anco)
                    return ('conco');
                else if (!this.conco);
                return ('anco');
            },
            GetCompanyViewName: function () {
                if (this.anco && this.conco)
                    return ('Anco và Conco');
                else if (!this.anco)
                    return ('Conco');
                else if (!this.conco);
                return ('Anco');
            }
        },
        dealer: {
            direct: true,
            indirect: true,
            GetDealerName: function () {
                if (this.direct && this.indirect)
                    return ('all');
                else if (!this.indirect)
                    return ('1');
                else if (!this.direct);
                return ('0');
            },
            GetDealerViewName: function () {
                if (this.direct && this.indirect)
                    return ('Trực tiếp và gián tiếp');
                else if (!this.indirect)
                    return ('Trực tiếp');
                else if (!this.direct);
                return ('Gián tiếp');
            }
        },
        area: null,
        level: null,
        top: { id: 100, name: "100" },
        brand: { id: 'AC', name: "ANCO" },
    };


    function getSelectedOption() {
        return SELECTED_OPTION_CACHE;
    }


    function CacheSelectedOption(selected) {
        SELECTED_OPTION_CACHE = selected;
    }

    return {
        GetSelectedOption: getSelectedOption,
        CacheSelectedOption: CacheSelectedOption,
    };
})
//cache Agency Filter Controller data
.service('AgencyFilterCache', function () {
    //default value
    var SELECTED_OPTION_CACHE = {
        company: {
            anco: false,
            conco: false,
            GetCompanyName: function () {
                if (this.anco && this.conco)
                    return ('all');
                else if (!this.anco)
                    return ('conco');
                else if (!this.conco);
                return ('anco');
            }
        },
        area: null,
        level: null,
        is_store: false,
    };

    function getSelectedOption() {

        return SELECTED_OPTION_CACHE;

    }


    function CacheSelectedOption(selected) {
        SELECTED_OPTION_CACHE = selected;
        SELECTED_OPTION_CACHE.is_store = true;
    }

    return {
        GetSelectedOption: getSelectedOption,
        CacheSelectedOption: CacheSelectedOption,
    };
})

.service('AgencyDealerCache', function () {
    var COMPANY;
    var DEALER;
    var BUY;

    function CacheCompany(company) {
        COMPANY = company;
    }
    function CacheDealer(dealer) {
        DEALER = dealer;
    }
    function CacheBuy(buy) {
        BUY = buy;
    }

    function GetCompany() {
        if (COMPANY == 0)
            return 'anco';
        else if (COMPANY == 1)
            return 'conco';
        else
            return 'all';
    }
    function GetDealer() {
        return DEALER;
    }
    function GetBuy() {
        return BUY;
    }
    return {
        CacheCompany: CacheCompany,
        CacheDealer: CacheDealer,
        CacheBuy: CacheBuy,
        GetCompany: GetCompany,
        GetDealer: GetDealer,
        GetBuy: GetBuy,

    };
})

.service('AuthService', function ($rootScope, $q, $http, $localstorage, USER_ROLES, AUTH_EVENTS, NETWORK, STORAGE_KEYS, RoleService, SurveyDealersCache) {
    var serviceBase = NETWORK.BASE_URL;
    var LOCAL_TOKEN_KEY = STORAGE_KEYS.token_key;
    var LOCAL_USER_KEY = STORAGE_KEYS.user_key;
    var LIST_DEALERS_KEY = STORAGE_KEYS.list_dealers;
    var APP_VERSION_KEY = STORAGE_KEYS.appversion_dealers;
    var LAST_ID_PROVINCE_SELECTED = STORAGE_KEYS.last_provinceid_selected;
    var isAuthenticated = false;
    var role = '';
    var authToken;
    var user;
    var appVersion = '';

    function loadUserCredentials() {
        var token = $localstorage.get(LOCAL_TOKEN_KEY);
        var appVersion = $localstorage.get(APP_VERSION_KEY);
        var retrievedUser = $localstorage.get(LOCAL_USER_KEY);
        //console.log(retrievedUser);
        if (token && retrievedUser) {
            useCredentials(token);
            user = JSON.parse(retrievedUser);
        }

    }

    function storeUserCredentials(u, token) {
        $localstorage.set(LOCAL_TOKEN_KEY, token);
        $localstorage.set(LOCAL_USER_KEY, JSON.stringify(u));
        useCredentials(token);
        user = u;
        $rootScope.$broadcast(AUTH_EVENTS.authenticated);
        RoleService.getUserRole(user.SaleRepId);
        RoleService.setCompany(user.AC_PC);
    }

    function useCredentials(token) {
        isAuthenticated = true;
        authToken = token;
        //console.log(token);

        // Set the token as header for your requests!
        // $http.defaults.headers.common['X-Auth-Token'] = 'Bearer ' + token;
        // $http.defaults.headers.common.Authorization = 'Bearer ' + token;
    }

    function checkVersion(currentVersion) {
        if (appVersion != currentVersion) {
            destroyUserCredentials();
            $localstorage.set(APP_VERSION_KEY, currentVersion);
            appVersion = currentVersion;
        }
    }

    function destroyUserCredentials() {
        authToken = undefined;
        isAuthenticated = false;
        $localstorage.deleteObject(LOCAL_TOKEN_KEY);
        $localstorage.deleteObject(LOCAL_USER_KEY);
        $localstorage.deleteObject(LIST_DEALERS_KEY);
        $localstorage.deleteObject(LAST_ID_PROVINCE_SELECTED);
        RoleService.resetUserRole();
        SurveyDealersCache.clearCache();
    }

    var login = function (userdata) {
        //console.log("login");
        return $q(function (resolve, reject) {
            var id = userdata.id;
            var pass = userdata.password;


            var param = {
                id: id,
                password: pass
            }

            $http.post(serviceBase + '/login', param, { timeout: $rootScope.TIME_OUT })
                .then(function successCallback(response) {
                    var user = response.data.user;
                    var token = response.data.token;

                    storeUserCredentials(user, token);
                    resolve('Login success.');
                }, function errorCallback(response) {
                    if (response.status != 0 && response.status != 408) {
                        console.log("login failed, statusCode: " + response.status);
                        reject(response);
                    }
                });
        });
    };

    var logout = function () {
        destroyUserCredentials();
    };

    var isAuthorized = function (authorizedRoles) {
        if (!angular.isArray(authorizedRoles)) {
            authorizedRoles = [authorizedRoles];
        }
        return (isAuthenticated && authorizedRoles.indexOf(role) !== -1);
    };

    loadUserCredentials();

    return {
        login: login,
        logout: logout,
        isAuthorized: isAuthorized,
        checkVersion: checkVersion,
        appVersion: function () { return appVersion; },
        token: function () { return authToken; },
        isAuthenticated: function () { return isAuthenticated; },
        user: function () { return user; }
    };
})

.factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
    return {
        responseError: function (response) {
            $rootScope.$broadcast({
                401: AUTH_EVENTS.notAuthenticated,
                403: AUTH_EVENTS.notAuthorized
            }[response.status], response);
            return $q.reject(response);
        }
    };
})

.factory('NetworkInterceptor', function ($rootScope, $q, NETWORK_EVENTS) {
    var networkInterceptor = {

        request: function (config) {
            config.timeout = 60000;
            return config;
        },

        responseError: function (rejection) {
            switch (rejection.status) {
                case 0:
                    $rootScope.$broadcast(NETWORK_EVENTS.nointernet);
                    break;
                case 408:
                    $rootScope.$broadcast(NETWORK_EVENTS.timeout);
                    break;
            }

            return $q.reject(rejection);
        }
    };

    return networkInterceptor;
})

.config(function ($httpProvider) {
    $httpProvider.interceptors.push('AuthInterceptor');
    $httpProvider.interceptors.push('NetworkInterceptor');
})

.factory('$localstorage', function () {
    return {
        set: function (key, value) {
            window.localStorage.setItem(key, value);
        },

        get: function (key, defaultValue) {
            return window.localStorage.getItem(key) || defaultValue;
        },

        setObject: function (key, value) {
            window.localStorage.setItem(key, JSON.stringify(value));
        },

        getObject: function (key) {
            if (window.localStorage.getItem(key) === null || window.localStorage.getItem(key) === undefined) {
                return undefined;
            } else {
                return JSON.parse(window.localStorage.getItem(key) || '{}');
            }
        },

        deleteObject: function (key) {
            window.localStorage.removeItem(key);
        }
    }
})

.service('DisplayService', function () {
    var pleaseWaitDiv = $('<div class="modal-body"><p>Some text in the modal.</p></div>');
    return {
        showPleaseWait: function () {
            pleaseWaitDiv.modal('show');
        },
        hidePleaseWait: function () {
            pleaseWaitDiv.modal('hide');
        },

    };
})

//--- Custom for Survey by NDHuy ---

.service('SurveyCache', function ($rootScope, USERS) {
    var _isCached = false;
    var _company = {
        anco: false,
        conco: false,
        getCompany: function () {
            if (this.anco && this.conco)
                return 'all';
            else if (this.anco)
                return 'anco';
            else if (this.conco)
                return 'conco';
            else
                return false;
        }
    };

    if (!_isCached) {
        switch ($rootScope.user_info.role) {
            case USERS.SUPERVISOR:
            case USERS.ASM:
            case USERS.RSM:
                if (!$rootScope.user_info.company)
                    _company.anco = true;
                else
                    _company.conco = true;
                break;
            case USERS.NSM:
                _company.anco = true;
                _company.conco = true;
        }
    }

    var _buy;
    var _regions;
    var _region;
    var _provinces;
    var _province;
    var _district;
    var _districts;
    var _dealer;
    var _lock;

    function setCompany(company) {
        _company.anco = company.anco;
        _company.conco = company.conco;
    }

    function setBuy(buy) {
        _buy = buy;
    }

    function setRegions(regions) {
        _regions = regions;
    }

    function setProvinces(provinces) {
        _provinces = provinces;
    }

    function setDistricts(districts) {
        _districts = districts;
    }

    function setRegion(region) {
        _region = region;
    }

    function setProvince(province) {
        _province = province;
    }

    function setDistrict(district) {
        _district = district;
    }

    function setDealer(dealer) {
        _dealer = dealer;
    }

    function setLock(lock) {
        _lock = lock;
    }

    function getCompany() {
        return _company;
    }

    function getBuy() {
        return _buy;
    }

    function getRegions() {
        return _regions;
    }

    function getProvinces() {
        return _provinces;
    }

    function getDistricts() {
        return _districts;
    }

    function getRegion() {
        return _region;
    }

    function getProvince() {
        return _province;
    }

    function getDistrict() {
        return _district;
    }

    function getDealer() {
        return _dealer;
    }

    function cache() {
        _isCached = true;
    }

    function isCached() {
        return _isCached;
    }

    function getLock() {
        return _lock;
    }

    function clearCache() {

        _company = {
            anco: false,
            conco: false,
            getCompany: function () {
                if (this.anco && this.conco)
                    return 'all';
                else if (this.anco)
                    return 'anco';
                else if (this.conco)
                    return 'conco';
                else
                    return false;
            }
        };

        _buy = null;
        _region = null;
        _regions = null;
        _provinces = null;
        _province = null;
        _district = null;
        _districts = null;
        _dealer = null;
        _lock = null;
        _isCached = false;
    }

    return {
        setCompany: setCompany,
        setBuy: setBuy,
        setRegion: setRegion,
        setRegions: setRegions,
        setProvince: setProvince,
        setProvinces: setProvinces,
        setDistrict: setDistrict,
        setDistricts: setDistricts,
        setDealer: setDealer,
        getCompany: getCompany,
        getBuy: getBuy,
        getRegion: getRegion,
        getRegions: getRegions,
        getProvince: getProvince,
        getProvinces: getProvinces,
        getDistrict: getDistrict,
        getDistricts: getDistricts,
        getDealer: getDealer,
        isCached: isCached,
        cache: cache,
        setLock: setLock,
        getLock: getLock,
        clearCache: clearCache
    }
})

.service('SurveyListDealers', function ($http, $rootScope, NETWORK) {
    var serviceBase = NETWORK.API_URL;

    // function to get data from server
    function CallGetMethod(URL, transition_func) {
        return $http.get(URL, { timeout: $rootScope.TIME_OUT })
            .then(function successCallback(response) {
                //translate the response data to data format
                // return promise
                return transition_func(response.data);
            }, function errorCallback(response) {
                if (response.status != 0 && response.status != 408) {
                    console.log("get data failed, statusCode: " + response.status);
                    return null;
                }
            });
    }

    function getListOfDealers(params) {
        return CallGetMethod(serviceBase + 'dealer/regions/' + params.region.id + '/provinces/' + params.province.id + '/districts/' + params.district.id + '/wards/all/buy/' + params.buy + '/company/' + params.company + '/offset/' + params.offset, function (rawData) {

            return rawData.response;
        });
    }

    function getNumberOfDealers(params) {
        return CallGetMethod(serviceBase + 'dealer/statistics/regions/' + params.region.id + '/provinces/' + params.province.id + '/districts/' + params.district.id + '/wards/all/buy/' + params.buy + '/company/' + params.company, function (rawData) {

            return rawData.response;
        });
    }

    return {
        getListOfDealers: getListOfDealers,
        getNumberOfDealers: getNumberOfDealers
    }
})

.service('SurveyDealerInfo', function ($http, $rootScope, NETWORK) {
    var serviceBase = NETWORK.API_URL;

    // function to get data from server
    function CallGetMethod(URL, transition_func) {
        return $http.get(URL, { timeout: $rootScope.TIME_OUT })
            .then(function successCallback(response) {
                //translate the response data to data format
                // return promise
                return transition_func(response.data);
            }, function errorCallback(response) {
                if (response.status != 0 && response.status != 408) {
                    console.log("get data failed, statusCode: " + response.status);
                    return null;
                }
            });
    }

    function getDealerInfo(params) {
        return CallGetMethod(serviceBase + 'dealer/' + params.dealer + '/report/buy/' + params.buy + '/company/' + params.company, function (rawData) {

            return rawData;
        });

    }

    function getBrands() {
        return CallGetMethod(serviceBase + 'brands', function (rawData) {
            var brands = {};

            for (var i = 0; i < rawData.length; i++) {
                brands[rawData[i].brand_id] = rawData[i].brand_name;
            }

            brands.TOTAL = 'Tất cả';

            return brands;
        });
    }

    return {
        getDealerInfo: getDealerInfo,
        getBrands: getBrands
    }
})

.service('SurveyDealersCache', function () {

    var _dealers;
    var _isCached = false;
    var _numberOfDealers;

    function setDealers(dealers) {
        _dealers = dealers;
    }

    function getDealers() {
        return _dealers;
    }

    function cache(status) {
        _isCached = status;
    }

    function isCached() {
        return _isCached;
    }

    function setNumberOfDealers(number) {
        _numberOfDealers = number;
    }

    function getNumberOfDealers() {
        return _numberOfDealers;
    }

    function clearCache() {
        _isCached = false;
        _dealers = null;
        _numberOfDealers = null;
    }

    return {
        setDealers: setDealers,
        getDealers: getDealers,
        cache: cache,
        isCached: isCached,
        setNumberOfDealers: setNumberOfDealers,
        getNumberOfDealers: getNumberOfDealers,
        clearCache: clearCache
    }

})

.service('RoleService', function ($http, $rootScope, NETWORK, $localstorage) {
    var serviceBase = NETWORK.API_URL;

    var _regions,
        _provinces,
        _company;

    // function to get data from server
    function CallGetMethod(URL, transition_func) {
        return $http.get(URL, { timeout: $rootScope.TIME_OUT })
            .then(function successCallback(response) {
                //translate the response data to data format
                // return promise
                return transition_func(response.data);
            }, function errorCallback(response) {
                if (response.status != 0 && response.status != 408) {
                    console.log("get data failed, statusCode: " + response.status);
                    return null;
                }
            })
        ;
    }

    function getUserRole(user_id) {

        CallGetMethod(serviceBase + 'salerep/' + user_id, function (rawData) {
            var data = rawData.response;

            _regions = [];
            _provinces = {};

            for (var region in data.regions) {
                _regions.push({
                    id: region,
                    name: data.regions[region]
                });
            }

            for (var province in data.provinces) {
                _provinces[province] = data.provinces[province];
            }

            window.localStorage.setItem('REGIONS', JSON.stringify(_regions));
            window.localStorage.setItem('PROVINCES', JSON.stringify(_provinces));
        });
    }

    function resetUserRole() {
        _regions = null;
        _provinces = null;
        localStorage.removeItem('REGIONS');
        localStorage.removeItem('PROVINCES');
    }

    function getRegions() {
        if (!_regions)
            _regions = JSON.parse(localStorage.REGIONS);
        return _regions;
    }

    function getProvinces() {
        if (!_provinces)
            _provinces = JSON.parse(localStorage.PROVINCES);
        return _provinces;
    }

    function setCompany(company) {
        if (1 == company)
            _company = 'CONCO';
        else if (0 == company)
            _company = 'ANCO';
    }

    function getCompany() {
        return _company;
    }

    return {
        getUserRole: getUserRole,
        resetUserRole: resetUserRole,
        getRegions: getRegions,
        getProvinces: getProvinces,
        setCompany: setCompany,
        getCompany: getCompany
    }
});