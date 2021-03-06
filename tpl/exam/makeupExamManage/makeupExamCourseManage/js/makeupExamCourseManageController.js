/**
 * Created by test on 2017/6/27.
 */
;(function (window, undefined) {
    'use strict';
    //考试课程维护Controller
    window.makeupExam_courseManageController = function($compile, baseinfo_generalService, app, $scope, $uibModal, $rootScope, $window, makeupExam_courseManageService, alertService) {
        //学年学期
        baseinfo_generalService.findAcadyeartermNamesBox(function (error, message,data) {
            if (error) {
                alertService(message);
                return;
            }
            $scope.semesterObjs = data.data;
            var html = '' +
                '<select ui-select2 ng-options="plateObj.id as plateObj.acadYearSemester  for plateObj in semesterObjs" '
                +  ' ng-model="examQualification.semesterId" id="semesterId" name="semesterId" ui-jq="chosen"ui-options="{search_contains: true}" class="form-control"> '
                +  '<option value="">==请选择==</option> '
                +  '</select>';
            angular.element("#semesterId").parent().empty().append(html);
            $compile(angular.element("#semesterId").parent().contents())($scope);
        });

        // 表格的高度
        $scope.table_height = $window.innerHeight - 223;

        // 查询参数
        $scope.queryParams = function queryParams(params) {
            var pageParam = {
                pageSize: params.pageSize,   //页面大小
                pageNo: params.pageNumber,  //页码
                sortName: params.sortName,
                sortOrder: params.sortOrder,
                examType:"2"
            };
            return angular.extend(pageParam, $scope.examQualification);
        }

        $scope.examCourseManageTable = {
            onLoadSuccess: function() {
                $compile(angular.element('#examCourseManageTable').contents())($scope);
            },
            url:app.api.address + '/exam/testTask/examCourseManage',
            method: 'get',
            cache: false,
            height: $scope.table_height,
            toolbar: '#toolbar', //工具按钮用哪个容器
            sidePagination: "server", //分页方式：client客户端分页，server服务端分页（*）
            queryParamsType: '', // 默认值为 'limit' ,在默认情况下 传给服务端的参数为：offset,limit,sort 设置为 '' 在这种情况下传给服务器的参数为：pageSize,pageNumber
            queryParams: $scope.queryParams,//传递参数（*）
            striped: true,
            pagination: true,
            pageSize: 10,
            pageNumber: 1,
            pageList: [5, 10, 20, 50],
            search: false,
            showColumns: true,
            showRefresh: true,
            clickToSelect: true,
            responseHandler:function(response){
                return response.data;
            },
            columns: [
                {checkbox: true, width: "3%"},
                {field: "semester", title: "开课学期", align: "center", valign: "middle"},
                {field: "courseNum", title: "课程代码", align: "center", valign: "middle"},
                {field: "courseNanme", title: "课程名称", align: "center", valign: "middle"},
                {field: "courseProperty", title: "课程属性", align: "center", valign: "middle"},
                {field: "dept", title: "开课单位", align: "center", valign: "middle"},
                {field: "credit", title: "学分", align: "center", valign: "middle"},
                {field: "totalHour", title: "总学时", align: "center", valign: "middle"},
                {field: "theoryHour", title: "理论学时", align: "center", valign: "middle"},
                {field: "practiceHour", title: "实践学时", align: "center", valign: "middle"},
                {field: "downSign", title: "是否下放", align: "center", valign: "middle",
                    formatter: function (value, row, index) {
                        if(value =="1"){
                            return "是";
                        }
                        return "否";
                    }},
                {field: "cz", title: "操作", align: "center", valign: "middle", width: "10%",
                    formatter: function (value, row, index) {
                        if(row.downSign =="1"){
                            return "<button type='button' ng-click='downOrRecover(" + JSON.stringify(row) + ")' class='btn btn-default'>回收</button>";
                        }
                        return "<button type='button' ng-click='downOrRecover(" + JSON.stringify(row) + ")' class='btn btn-default'>下放</button>";
                    }
                }
            ]
        };

        // 查询表单显示和隐藏切换
        $scope.isHideSearchForm = false; // 默认显示
        $scope.searchFormHideToggle = function () {
            $scope.isHideSearchForm = !$scope.isHideSearchForm
            if ($scope.isHideSearchForm) {
                $scope.table_height = $scope.table_height + 115;
            } else {
                $scope.table_height = $scope.table_height - 115;
            }
            angular.element('#examCourseManageTable').bootstrapTable('resetView',{ height: $scope.table_height } );
        };

        //回收下放
        $scope.downOrRecover = function(data){
            var stauts = "1";
            if(data.downSign == "1"){
                stauts = "0";
            }
            if(stauts == "0"){
                //回收
                $rootScope.showLoading = true; // 开启加载提示
                makeupExam_courseManageService.update(data.id, stauts, "",function (error, message,data) {
                    $rootScope.showLoading = false; // 关闭加载提示
                    if (error) {
                        alertService(message);
                        return;
                    }else{
                        alertService('success', '操作成功');
                        angular.element('#examCourseManageTable').bootstrapTable('refresh');
                    }
                });
                return;
            }else {
                //下放
                $uibModal.open({
                    animation: true,
                    backdrop: 'static',
                    templateUrl: 'tpl/exam/finalExamManage/examCourseManage/downDept.html',
                    resolve: {
                        ids: function () {
                            return [data.id];
                        }
                    },
                    controller: downController
                });
            }


        }
        
        // 查询表单提交
        $scope.searchSubmit = function () {
            angular.element('#examCourseManageTable').bootstrapTable('selectPage', 1);
        };
        // 查询表单重置
        $scope.searchReset = function () {
            $scope.examQualification = {};
            angular.element('form[name="pyfabzkz_form"] select[ui-jq="chosen"]').val("").trigger("chosen:updated");
            angular.element('#examCourseManageTable').bootstrapTable('refresh');
        };


        // 任务下放
        $scope.toDown = function(){
            var ids = [];
            var rows = $('#examCourseManageTable').bootstrapTable('getSelections');
            if(rows.length == 0){
                alertService('请先选择要下放的项');
                return;
            }
            rows.forEach (function(row) {
                ids.push(row.id);
            })
            $uibModal.open({
                animation: true,
                backdrop: 'static',
                templateUrl: 'tpl/exam/makeupExamManage/makeupExamCourseManage/downDept.html',
                resolve: {
                    ids: function () {
                        return ids;
                    }
                },
                controller: downController
            });

        };
    }
    makeupExam_courseManageController.$inject = ['$compile', 'baseinfo_generalService', 'app', '$scope', '$uibModal', '$rootScope', '$window', 'makeupExam_courseManageService', 'alertService'];
// 下放控制器
    var downController = function ($scope,alertService, $rootScope, baseinfo_generalService, $compile, $uibModalInstance, ids, makeupExam_courseManageService) {
        baseinfo_generalService.findDepartmentNamesBox(function (error, message,data) {
            if (error) {
                alertService(message);
                return;
            }
            $scope.dept = data.data;
            var html = '' +
                '<select ui-select2 ng-options="plateObj.departmentNumber as plateObj.departmentName  for plateObj in dept" '
                +  ' ng-model="down.deptId" id="deptId" name="deptId" ui-jq="chosen"ui-options="{search_contains: true}" class="form-control"> '
                +  '<option value="">==请选择==</option> '
                +  '</select>';
            angular.element("#deptId").parent().empty().append(html);
            $compile(angular.element("#deptId").parent().contents())($scope);
        });

        $scope.down = {};


        $scope.ok = function () {
            var param = {
                ids : ids,
                deptId : $scope.down.deptId
            }
            $rootScope.showLoading = true; // 开启加载提示
            makeupExam_courseManageService.batchDown(param,function (error, message,data) {
                $rootScope.showLoading = false; // 关闭加载提示
                if (error) {
                    alertService(message);
                    return;
                }else{
                    alertService('success', '操作成功');
                    angular.element('#examCourseManageTable').bootstrapTable('refresh');
                }
            });
            $uibModalInstance.close();
        };
        $scope.cancel = function () {
            $uibModalInstance.close();
        };
    };
    downController.$inject = ['$scope','alertService', '$rootScope', 'baseinfo_generalService', '$compile', '$uibModalInstance', 'ids', 'makeupExam_courseManageService'];

})(window);
