{
    "code": 200,
    "msg": "操作成功",
    "data": {
        "logId": 33847,
        "caseId": 2499,
        "executionTime": "2025-12-23T10:09:12",
        "isSuccess": 1,
        "executionData": {
            "log": "2025-12-23 10:09:11.360 | cb65a05a079c4fb8b9c3b8db93c3c37c | INFO     | module_admin.api_testing.api_cache_data.service.cache_data_service:get_cachedata_by_key:41 - 获取缓存；environment_cache:user:1:env:1:token\n2025-12-23 10:09:11.419 | cb65a05a079c4fb8b9c3b8db93c3c37c | INFO     | module_admin.api_testing.api_cache_data.service.cache_data_service:get_cachedata_by_key:41 - 获取缓存；environment_cache:user:1:env:1:最大单词数量\n2025-12-23 10:09:11.479 | cb65a05a079c4fb8b9c3b8db93c3c37c | INFO     | utils.api_tools.executors.manager:execute_setup_list:25 - 开始执行前置脚本，共0个\n2025-12-23 10:09:11.479 | cb65a05a079c4fb8b9c3b8db93c3c37c | INFO     | utils.api_tools.executors.manager:_execute_list:91 - setup_type 脚本执行完成，成功: 0, 失败: 0\n2025-12-23 10:09:11.972 | cb65a05a079c4fb8b9c3b8db93c3c37c | WARNING  | config.get_httpclient:on_request_end:39 - 整个请求耗时 0.493s\n2025-12-23 10:09:11.972 | cb65a05a079c4fb8b9c3b8db93c3c37c | WARNING  | utils.api_tools.executors.api_request_exector:_send_request_with_info:236 - 接口发送获取响应阶段耗时0.49358320236206055\n2025-12-23 10:09:11.973 | cb65a05a079c4fb8b9c3b8db93c3c37c | INFO     | utils.api_tools.executors.manager:execute_teardown_list:31 - 开始执行后置脚本，共1个\n2025-12-23 10:09:12.084 | cb65a05a079c4fb8b9c3b8db93c3c37c | INFO     | utils.api_tools.executors.manager:_execute_list:77 - teardown_type 脚本执行成功: : 结果：{'success': True, 'message': '变量 token 提取成功，值为: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsInVzZXJfbmFtZSI6ImFkbWluIiwiZGVwdF9uYW1lIjoiXHU3ODE0XHU1M2QxXHU5MGU4XHU5NWU4Iiwic2Vzc2lvbl9pZCI6IjI1ODA4NDE4LWQ1ZmEtNGQ2YS1hOTNiLTU2M2E4ODQyYmE3YSIsImxvZ2luX2luZm8iOnsiaXBhZGRyIjoiMTI3LjAuMC4xIiwibG9naW5Mb2NhdGlvbiI6Ilx1NTE4NVx1N2Y1MUlQIiwiYnJvd3NlciI6IlB5dGhvbiBhaW9odHRwIDMuMTIuMTUiLCJvcyI6Ik90aGVyICIsImxvZ2luVGltZSI6IjIwMjUtMTItMjMgMTA6MDk6MTEifSwiZXhwIjoxNzY2NTQyMTUxfQ.QloAj8HgaCQ3ibXBOiNqooA68AMNbiZ4rWSw50UIExI', 'data': None, 'error': None, 'variables': {'token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsInVzZXJfbmFtZSI6ImFkbWluIiwiZGVwdF9uYW1lIjoiXHU3ODE0XHU1M2QxXHU5MGU4XHU5NWU4Iiwic2Vzc2lvbl9pZCI6IjI1ODA4NDE4LWQ1ZmEtNGQ2YS1hOTNiLTU2M2E4ODQyYmE3YSIsImxvZ2luX2luZm8iOnsiaXBhZGRyIjoiMTI3LjAuMC4xIiwibG9naW5Mb2NhdGlvbiI6Ilx1NTE4NVx1N2Y1MUlQIiwiYnJvd3NlciI6IlB5dGhvbiBhaW9odHRwIDMuMTIuMTUiLCJvcyI6Ik90aGVyICIsImxvZ2luVGltZSI6IjIwMjUtMTItMjMgMTA6MDk6MTEifSwiZXhwIjoxNzY2NTQyMTUxfQ.QloAj8HgaCQ3ibXBOiNqooA68AMNbiZ4rWSw50UIExI'}, 'execution_time': 0.11045503616333008, 'log': {'token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsInVzZXJfbmFtZSI6ImFkbWluIiwiZGVwdF9uYW1lIjoiXHU3ODE0XHU1M2QxXHU5MGU4XHU5NWU4Iiwic2Vzc2lvbl9pZCI6IjI1ODA4NDE4LWQ1ZmEtNGQ2YS1hOTNiLTU2M2E4ODQyYmE3YSIsImxvZ2luX2luZm8iOnsiaXBhZGRyIjoiMTI3LjAuMC4xIiwibG9naW5Mb2NhdGlvbiI6Ilx1NTE4NVx1N2Y1MUlQIiwiYnJvd3NlciI6IlB5dGhvbiBhaW9odHRwIDMuMTIuMTUiLCJvcyI6Ik90aGVyICIsImxvZ2luVGltZSI6IjIwMjUtMTItMjMgMTA6MDk6MTEifSwiZXhwIjoxNzY2NTQyMTUxfQ.QloAj8HgaCQ3ibXBOiNqooA68AMNbiZ4rWSw50UIExI'}}\n2025-12-23 10:09:12.085 | cb65a05a079c4fb8b9c3b8db93c3c37c | INFO     | utils.api_tools.executors.manager:_execute_list:91 - teardown_type 脚本执行完成，成功: 1, 失败: 0",
            "context": null,
            "response": {
                "envId": 1,
                "caseId": 2499,
                "caseName": "Login",
                "isSuccess": true,
                "requestUrl": "http://127.0.0.1:9099/login",
                "requestBody": {
                    "password": "sdw123456",
                    "username": "admin"
                },
                "errorMessage": null,
                "responseBody": {
                    "msg": "登录成功",
                    "code": 200,
                    "time": "2025-12-23T10:09:11.965641",
                    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsInVzZXJfbmFtZSI6ImFkbWluIiwiZGVwdF9uYW1lIjoiXHU3ODE0XHU1M2QxXHU5MGU4XHU5NWU4Iiwic2Vzc2lvbl9pZCI6IjI1ODA4NDE4LWQ1ZmEtNGQ2YS1hOTNiLTU2M2E4ODQyYmE3YSIsImxvZ2luX2luZm8iOnsiaXBhZGRyIjoiMTI3LjAuMC4xIiwibG9naW5Mb2NhdGlvbiI6Ilx1NTE4NVx1N2Y1MUlQIiwiYnJvd3NlciI6IlB5dGhvbiBhaW9odHRwIDMuMTIuMTUiLCJvcyI6Ik90aGVyICIsImxvZ2luVGltZSI6IjIwMjUtMTItMjMgMTA6MDk6MTEifSwiZXhwIjoxNzY2NTQyMTUxfQ.QloAj8HgaCQ3ibXBOiNqooA68AMNbiZ4rWSw50UIExI",
                    "success": true
                },
                "responseTime": 0.49358320236206055,
                "executionTime": "2025-12-23T10:09:11.973677",
                "requestMethod": "POST",
                "requestParams": null,
                "requestCookies": {
                    "1": "{{x=random_string({{最大单词数量}})}}"
                },
                "requestHeaders": {
                    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsInVzZXJfbmFtZSI6ImFkbWluIiwiZGVwdF9uYW1lIjoiXHU3ODE0XHU1M2QxXHU5MGU4XHU5NWU4Iiwic2Vzc2lvbl9pZCI6IjYwMzg2N2I2LWRlYzEtNGM4My04NzczLWY1ZGE0N2M4Y2EyMCIsImxvZ2luX2luZm8iOnsiaXBhZGRyIjoiMTI3LjAuMC4xIiwibG9naW5Mb2NhdGlvbiI6Ilx1NTE4NVx1N2Y1MUlQIiwiYnJvd3NlciI6IlB5dGhvbiBhaW9odHRwIDMuMTIuMTUiLCJvcyI6Ik90aGVyICIsImxvZ2luVGltZSI6IjIwMjUtMTItMjMgMTA6MDI6MzQifSwiZXhwIjoxNzY2NTQxNzU0fQ.qULUPETBLKmirOUEEZSH7F6D83IGo-Dh7Td6BVUTR3U"
                },
                "responseCookies": {},
                "responseHeaders": {
                    "Date": "Tue, 23 Dec 2025 02:09:10 GMT",
                    "Server": "uvicorn",
                    "request-id": "1af9f48c34254bd4ae8948f3881138e6",
                    "Content-Type": "application/json",
                    "Content-Length": "570"
                },
                "responseStatusCode": 200
            },
            "setupResults": [],
            "assersionResult": {
                "log": {
                    "total": 0,
                    "failed": 0,
                    "results": [],
                    "success": 0,
                    "execution_time": 0.0
                },
                "data": null,
                "error": null,
                "message": "断言执行成功 (0/0)",
                "success": true,
                "variables": null,
                "executionTime": 0.0
            },
            "teardownResults": [
                {
                    "log": {
                        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsInVzZXJfbmFtZSI6ImFkbWluIiwiZGVwdF9uYW1lIjoiXHU3ODE0XHU1M2QxXHU5MGU4XHU5NWU4Iiwic2Vzc2lvbl9pZCI6IjI1ODA4NDE4LWQ1ZmEtNGQ2YS1hOTNiLTU2M2E4ODQyYmE3YSIsImxvZ2luX2luZm8iOnsiaXBhZGRyIjoiMTI3LjAuMC4xIiwibG9naW5Mb2NhdGlvbiI6Ilx1NTE4NVx1N2Y1MUlQIiwiYnJvd3NlciI6IlB5dGhvbiBhaW9odHRwIDMuMTIuMTUiLCJvcyI6Ik90aGVyICIsImxvZ2luVGltZSI6IjIwMjUtMTItMjMgMTA6MDk6MTEifSwiZXhwIjoxNzY2NTQyMTUxfQ.QloAj8HgaCQ3ibXBOiNqooA68AMNbiZ4rWSw50UIExI"
                    },
                    "data": null,
                    "error": null,
                    "message": "变量 token 提取成功，值为: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsInVzZXJfbmFtZSI6ImFkbWluIiwiZGVwdF9uYW1lIjoiXHU3ODE0XHU1M2QxXHU5MGU4XHU5NWU4Iiwic2Vzc2lvbl9pZCI6IjI1ODA4NDE4LWQ1ZmEtNGQ2YS1hOTNiLTU2M2E4ODQyYmE3YSIsImxvZ2luX2luZm8iOnsiaXBhZGRyIjoiMTI3LjAuMC4xIiwibG9naW5Mb2NhdGlvbiI6Ilx1NTE4NVx1N2Y1MUlQIiwiYnJvd3NlciI6IlB5dGhvbiBhaW9odHRwIDMuMTIuMTUiLCJvcyI6Ik90aGVyICIsImxvZ2luVGltZSI6IjIwMjUtMTItMjMgMTA6MDk6MTEifSwiZXhwIjoxNzY2NTQyMTUxfQ.QloAj8HgaCQ3ibXBOiNqooA68AMNbiZ4rWSw50UIExI",
                    "success": true,
                    "variables": {
                        "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsInVzZXJfbmFtZSI6ImFkbWluIiwiZGVwdF9uYW1lIjoiXHU3ODE0XHU1M2QxXHU5MGU4XHU5NWU4Iiwic2Vzc2lvbl9pZCI6IjI1ODA4NDE4LWQ1ZmEtNGQ2YS1hOTNiLTU2M2E4ODQyYmE3YSIsImxvZ2luX2luZm8iOnsiaXBhZGRyIjoiMTI3LjAuMC4xIiwibG9naW5Mb2NhdGlvbiI6Ilx1NTE4NVx1N2Y1MUlQIiwiYnJvd3NlciI6IlB5dGhvbiBhaW9odHRwIDMuMTIuMTUiLCJvcyI6Ik90aGVyICIsImxvZ2luVGltZSI6IjIwMjUtMTItMjMgMTA6MDk6MTEifSwiZXhwIjoxNzY2NTQyMTUxfQ.QloAj8HgaCQ3ibXBOiNqooA68AMNbiZ4rWSw50UIExI"
                    },
                    "executionTime": 0.11045503616333008
                }
            ]
        },
        "responseStatusCode": 200,
        "responseTime": 0.493583,
        "assertionSuccess": 1,
        "createBy": "",
        "createTime": "2025-12-23T10:09:12",
        "updateBy": "",
        "updateTime": "2025-12-23T10:09:12",
        "remark": null,
        "description": null,
        "sortNo": 2.0,
        "delFlag": 0,
        "method": "POST",
        "path": "http://127.0.0.1:9099/login",
        "name": "Login",
        "workflowId": 1,
        "reportId": 3824,
        "eventType": "case_result"
    },
    "success": true,
    "time": "2025-12-23T10:09:14.369180"
}