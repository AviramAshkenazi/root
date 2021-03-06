'use strict';

angular.module('mean.icu.ui.membersfooter', [])
    .directive('icuMembersFooter', function() {
        function controller($scope, $state, $injector, context, $stateParams, $timeout, circlesService,PermissionsService, UsersService, ActivitiesService,TasksService,ProjectsService, DiscussionsService, OfficeDocumentsService, FoldersService, OfficesService) {

            var serviceMap = {
                task: 'TasksService',
                tasks: 'TasksService',
                project: 'ProjectsService',
                projects: 'ProjectsService',
                discussion: 'DiscussionsService',
                discussions: 'DiscussionsService',
                office: 'OfficesService',
                offices: 'OfficesService',
                folder: 'FoldersService',
                folders: 'FoldersService',
                officeDocument: 'OfficeDocumentsService',
                officeDocuments: 'OfficeDocumentsService',
                templateDoc: 'TemplateDocsService',
                templateDocs: 'TemplateDocsService',
            };
            $scope.hideAddButton = context.main=="templateDocs" ? false:true;
            $scope.me = UsersService.getMe().$$state.value;

            $scope.userPermissionStatus = function(member){
                if(member) return PermissionsService.getPermissionStatus(member, $scope.entity) || "";
            };

            $scope.setEditor = function(entity, user){
                return changePerms(entity, user, 'editor');
            };

            $scope.setCommenter = function(entity, user){
                return changePerms(entity, user, 'commenter');
            };

            $scope.setViewer = function(entity, user){
                return changePerms(entity, user, 'viewer');
            };

            function changePerms(entity, member, newPerms){
                $scope.entity = PermissionsService.changeUsersPermissions(entity, member, newPerms, context);
                $state.reload();
            }

            console.log("permissions: " + JSON.stringify($scope.entity.permissions,null,2)) ;
            var groupTypes = config.circles.footer;

            var getWatchersGroups = function() {
                $scope.watchersGroups = [];
                var obj;
                for (var i = 0; i < groupTypes.length; i++) {
                    if ($scope.entity.circles && $scope.entity.circles[groupTypes[i]])
                        for (var j = 0; j < $scope.entity.circles[groupTypes[i]].length; j++) {
                            obj = groups.filter(function(obj) {
                                if (obj._id === $scope.entity.circles[groupTypes[i]][j]) {
                                    return obj;
                                }
                            })[0];
                            if (obj) {
                                obj.type = groupTypes[i];
                                $scope.watchersGroups.push(obj);
                            }
                        }
                }
            };

            var getNotAssigned = function() {
                var arr1 = _.filter($scope.users, function(u) {
                    return u._id;
                });
                arr1 = _.pluck(arr1, '_id');
                var arr2 = _.pluck($scope.entity.watchers, '_id');
                var diff = _.difference(arr1, arr2);
                var notAssigned = _.filter($scope.users, function(obj) {
                    return diff.indexOf(obj._id) >= 0;
                });
                arr1 = _.pluck(groups, '_id');
                var arr3;
                for (var i = 0; i < groupTypes.length; i++) {
                    arr3 = $scope.entity.circles && $scope.entity.circles[groupTypes[i]] ? $scope.entity.circles[groupTypes[i]] : [];
                    arr1 = _.difference(arr1, arr3);
                }

                var groupsNotAssigned = _.filter(groups, function(obj) {
                    return arr1.indexOf(obj._id) >= 0;
                });
                return groupsNotAssigned.concat(notAssigned);
            }


            $scope.notAssigned = getNotAssigned();
            for(var i =0 ; i<$scope.notAssigned.length;i++){
                if($scope.notAssigned[i] && ($scope.notAssigned[i].job == undefined || $scope.notAssigned[i].job==null)){
                    $scope.notAssigned[i].job = $scope.notAssigned[i].name;
                }
            }

            var update = function(entity, member, action) {
                $scope.notAssigned = getNotAssigned();
                for(var i =0 ; i<$scope.notAssigned.length;i++){
                    if($scope.notAssigned[i] && ($scope.notAssigned[i].job == undefined || $scope.notAssigned[i].job==null)){
                        $scope.notAssigned[i].job = $scope.notAssigned[i].name;
                    }
                }
                var serviceName = serviceMap[$stateParams.id ? context.main : context.entityName];
                var service = $injector.get(serviceName);
                var data = {
                    name: member.name,
                    type: member.type ? member.type : 'user',
                    action: action,
                    frequentUser: member._id
                }

                if(context.main=="officeDocuments"){
                    let a = [];
                    entity.watchers.forEach(function(watcher){
                        if(watcher instanceof Object) {
                            a.push(String(watcher._id)) ;
                        }
                        else {
                            a.push(String(watcher)) ;
                        }
                    });

                    var json = {
                        'name':'watchers',
                        'newVal':a
                    }
                    entity.watchers = a;
                    service.update(entity,json, action, member._id);
                    $state.reload();
                }
                else{
                    service.update(entity, data, action, member._id);
                }


                getWatchersGroups();

            };

            $scope.showSelect = false;
            var groups = [], allowed;

            circlesService.getmine().then(function(data) {
                for (var i = 0; data && i < groupTypes.length; i++){
                    allowed = data.allowed[groupTypes[i]];
                    allowed.forEach(function(g) {
                        g.type = groupTypes[i]
                    });
                    groups = groups.concat(allowed);
                }
                $scope.notAssigned = getNotAssigned();
                getWatchersGroups();
            });

            $scope.triggerSelect = function() {
                $scope.showSelect = !$scope.showSelect;
                if ($scope.showSelect) {
                    $scope.animate = false;
                }
            };

            $scope.changeUserPermStatus = function(entity, member, status){
                entity.permission.each(function(permission){
                    if(permission.id === member){
                        permission.level = status;
                    }
                });
                PermissionsService.updateEntityPermission(entity, context);
                return entity;
            };

            $scope.addMember = function(member) {
                $scope.showSelect = false;
                if (member.type) {

                    if (!$scope.entity.circles) $scope.entity.circles = {};
                    if (!$scope.entity.circles[member.type]) $scope.entity.circles[member.type] = [];
                    $scope.entity.circles[member.type].push(member._id);
                } else {
                    $scope.entity.watchers.push(member);
                    if($scope.entity.subTasks){
                        $scope.entity.subTasks.forEach((subTask)=>{
                            subTask.watchers.push(member);
                        });
                    }
                    if($scope.entity.subProjects){
                        $scope.entity.subProjects.forEach((subProject)=>{
                            subProject.watchers.push(member);
                        });
                    }
                }

                update($scope.entity, member, 'added');
                $scope.animate = true;

                var task = $scope.entity ;
                var me = $scope.me ;
                if (context.entityName === 'discussion') {
                    task.discussion = context.entityId;
                }
                switch(context.main) {
                    case 'projects':
                        ProjectsService.updateWatcher(task, me, member).then(function(result) {
                            ActivitiesService.data.push(result);
                        });
                        break ;
                    case 'tasks':
                        TasksService.updateWatcher(task, me, member).then(function(result) {
                            ActivitiesService.data.push(result);
                        });
                        break ;
                    case 'discussions':
                        DiscussionsService.updateWatcher(task, me, member).then(function(result) {
                            ActivitiesService.data = ActivitiesService.data || [] ;
                            ActivitiesService.data.push(result);
                        });
                        break ;
                    case 'officeDocuments':
                        OfficeDocumentsService.updateWatcher(task, me, member).then(function(result) {
                            ActivitiesService.data = ActivitiesService.data || [] ;
                            ActivitiesService.data.push(result);
                        });
                        break ;
                    case 'folders':
                        FoldersService.updateWatcher(task, me, member).then(function(result) {
                            ActivitiesService.data = ActivitiesService.data || [] ;
                            ActivitiesService.data.push(result);
                        });
                        break ;
                    case 'offices':
                        OfficesService.updateWatcher(task, me, member).then(function(result) {
                            ActivitiesService.data = ActivitiesService.data || [] ;
                            ActivitiesService.data.push(result);
                        });
                        break ;
                }

            };

            $scope.deleteMember = function(member) {
                if (member.type) {
                    $scope.entity.circles[member.type] = _.reject($scope.entity.circles[member.type], function(mem) {
                        return _.isEqual(member._id, mem);
                    });
                } else {
                    $scope.entity.watchers = _.reject($scope.entity.watchers, function(mem) {
                        return _.isEqual(member, mem);
                    });
                }

                update($scope.entity, member, 'removed');

                var task = $scope.entity ;
                var me = $scope.me ;
                if (context.entityName === 'discussion') {
                    task.discussion = context.entityId;
                }

                switch(context.main) {
                    case 'projects':
                        ProjectsService.updateWatcher(task, me, member, 'removeWatcher').then(function(result) {
                            ActivitiesService.data = ActivitiesService.data || [] ;
                            ActivitiesService.data.push(result);
                        });
                        break ;

                    case 'tasks':
                        TasksService.updateWatcher(task, me, member, 'removeWatcher').then(function(result) {
                            ActivitiesService.data.push(result);
                        });
                        break ;
                    case 'discussions':
                        DiscussionsService.updateWatcher(task, me, member, 'removeWatcher').then(function(result) {
                            ActivitiesService.data = ActivitiesService.data || [] ;
                            ActivitiesService.data.push(result);
                        });
                        break ;
                    case 'officeDocuments':
                        OfficeDocumentsService.updateWatcher(task, me, member, 'removeWatcher').then(function(result) {
                            ActivitiesService.data = ActivitiesService.data || [] ;
                            ActivitiesService.data.push(result);
                        });
                        break ;
                    case 'folders':
                        FoldersService.updateWatcher(task, me, member, 'removeWatcher').then(function(result) {
                            ActivitiesService.data = ActivitiesService.data || [] ;
                            ActivitiesService.data.push(result);
                        });
                        break ;
                    case 'offices':
                        OfficesService.updateWatcher(task, me, member, 'removeWatcher').then(function(result) {
                            ActivitiesService.data = ActivitiesService.data || [] ;
                            ActivitiesService.data.push(result);
                        });
                        break ;
                }
            };
        }

        return {
            restrict: 'A',
            scope: {
                entity: '=',
                users: '=',
                groups: '='
            },
            controller: controller,
            templateUrl: '/icu/components/members-footer/members-footer.html'
        };
    })
