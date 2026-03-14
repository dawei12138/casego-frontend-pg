{
    "code": 200,
    "msg": "操作成功",
    "data": {
        "setupResults": [],
        "response": {
            "caseId": 2496,
            "caseName": "Login",
            "envId": 1,
            "requestUrl": "http://127.0.0.1:9099/login",
            "requestMethod": "POST",
            "requestHeaders": {
                "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsInVzZXJfbmFtZSI6ImFkbWluIiwiZGVwdF9uYW1lIjoiXHU3ODE0XHU1M2QxXHU5MGU4XHU5NWU4Iiwic2Vzc2lvbl9pZCI6IjY5YzM5ZmE3LTJkYWEtNGJiYy1hNmZlLTZhMDJhNjlhMGE2MyIsImxvZ2luX2luZm8iOnsiaXBhZGRyIjoiMTI3LjAuMC4xIiwibG9naW5Mb2NhdGlvbiI6Ilx1NTE4NVx1N2Y1MUlQIiwiYnJvd3NlciI6IlB5dGhvbiBhaW9odHRwIDMuMTIuMTUiLCJvcyI6Ik90aGVyICIsImxvZ2luVGltZSI6IjIwMjUtMTItMjQgMDA6Mjc6MTYifSwiZXhwIjoxNzY2NTkzNjM2fQ.n272s2GaO7SX-mwYVGxie7zhTYN84Vqc1c3qlivpKMc",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            "requestParams": null,
            "requestBody": {
                "username": "admin",
                "password": "sdw123456"
            },
            "requestCookies": null,
            "responseCookies": {},
            "responseStatusCode": 200,
            "responseHeaders": {
                "Date": "Tue, 23 Dec 2025 16:28:15 GMT",
                "Server": "uvicorn",
                "Content-Length": "570",
                "Content-Type": "application/json",
                "request-id": "7c77ad00088a4431a794e27057096def"
            },
            "responseBody": {
                "code": 200,
                "msg": "登录成功",
                "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsInVzZXJfbmFtZSI6ImFkbWluIiwiZGVwdF9uYW1lIjoiXHU3ODE0XHU1M2QxXHU5MGU4XHU5NWU4Iiwic2Vzc2lvbl9pZCI6IjZmZjZjMzg3LWRmNzUtNGE2NS1hMmZkLTc2NThhZTE5MjE0MCIsImxvZ2luX2luZm8iOnsiaXBhZGRyIjoiMTI3LjAuMC4xIiwibG9naW5Mb2NhdGlvbiI6Ilx1NTE4NVx1N2Y1MUlQIiwiYnJvd3NlciI6IlB5dGhvbiBhaW9odHRwIDMuMTIuMTUiLCJvcyI6Ik90aGVyICIsImxvZ2luVGltZSI6IjIwMjUtMTItMjQgMDA6Mjg6MTUifSwiZXhwIjoxNzY2NTkzNjk1fQ.nyxdBf0AsHav6_yq_62y9wrFgmZLhKLgwaaksXPUOzc",
                "success": true,
                "time": "2025-12-24T00:28:15.655153"
            },
            "responseTime": 0.22654032707214355,
            "executionTime": "2025-12-24T00:28:15.664858",
            "isSuccess": true,
            "errorMessage": null
        },
        "teardownResults": [
            {
                "success": true,
                "message": "变量 token 提取成功，值为: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsInVzZXJfbmFtZSI6ImFkbWluIiwiZGVwdF9uYW1lIjoiXHU3ODE0XHU1M2QxXHU5MGU4XHU5NWU4Iiwic2Vzc2lvbl9pZCI6IjZmZjZjMzg3LWRmNzUtNGE2NS1hMmZkLTc2NThhZTE5MjE0MCIsImxvZ2luX2luZm8iOnsiaXBhZGRyIjoiMTI3LjAuMC4xIiwibG9naW5Mb2NhdGlvbiI6Ilx1NTE4NVx1N2Y1MUlQIiwiYnJvd3NlciI6IlB5dGhvbiBhaW9odHRwIDMuMTIuMTUiLCJvcyI6Ik90aGVyICIsImxvZ2luVGltZSI6IjIwMjUtMTItMjQgMDA6Mjg6MTUifSwiZXhwIjoxNzY2NTkzNjk1fQ.nyxdBf0AsHav6_yq_62y9wrFgmZLhKLgwaaksXPUOzc",
                "data": null,
                "error": null,
                "variables": {
                    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsInVzZXJfbmFtZSI6ImFkbWluIiwiZGVwdF9uYW1lIjoiXHU3ODE0XHU1M2QxXHU5MGU4XHU5NWU4Iiwic2Vzc2lvbl9pZCI6IjZmZjZjMzg3LWRmNzUtNGE2NS1hMmZkLTc2NThhZTE5MjE0MCIsImxvZ2luX2luZm8iOnsiaXBhZGRyIjoiMTI3LjAuMC4xIiwibG9naW5Mb2NhdGlvbiI6Ilx1NTE4NVx1N2Y1MUlQIiwiYnJvd3NlciI6IlB5dGhvbiBhaW9odHRwIDMuMTIuMTUiLCJvcyI6Ik90aGVyICIsImxvZ2luVGltZSI6IjIwMjUtMTItMjQgMDA6Mjg6MTUifSwiZXhwIjoxNzY2NTkzNjk1fQ.nyxdBf0AsHav6_yq_62y9wrFgmZLhKLgwaaksXPUOzc"
                },
                "executionTime": 0.003394603729248047,
                "log": {
                    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsInVzZXJfbmFtZSI6ImFkbWluIiwiZGVwdF9uYW1lIjoiXHU3ODE0XHU1M2QxXHU5MGU4XHU5NWU4Iiwic2Vzc2lvbl9pZCI6IjZmZjZjMzg3LWRmNzUtNGE2NS1hMmZkLTc2NThhZTE5MjE0MCIsImxvZ2luX2luZm8iOnsiaXBhZGRyIjoiMTI3LjAuMC4xIiwibG9naW5Mb2NhdGlvbiI6Ilx1NTE4NVx1N2Y1MUlQIiwiYnJvd3NlciI6IlB5dGhvbiBhaW9odHRwIDMuMTIuMTUiLCJvcyI6Ik90aGVyICIsImxvZ2luVGltZSI6IjIwMjUtMTItMjQgMDA6Mjg6MTUifSwiZXhwIjoxNzY2NTkzNjk1fQ.nyxdBf0AsHav6_yq_62y9wrFgmZLhKLgwaaksXPUOzc"
                }
            },
            {
                "success": true,
                "message": "变量 token111 提取成功，值为: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsInVzZXJfbmFtZSI6ImFkbWluIiwiZGVwdF9uYW1lIjoiXHU3ODE0XHU1M2QxXHU5MGU4XHU5NWU4Iiwic2Vzc2lvbl9pZCI6IjZmZjZjMzg3LWRmNzUtNGE2NS1hMmZkLTc2NThhZTE5MjE0MCIsImxvZ2luX2luZm8iOnsiaXBhZGRyIjoiMTI3LjAuMC4xIiwibG9naW5Mb2NhdGlvbiI6Ilx1NTE4NVx1N2Y1MUlQIiwiYnJvd3NlciI6IlB5dGhvbiBhaW9odHRwIDMuMTIuMTUiLCJvcyI6Ik90aGVyICIsImxvZ2luVGltZSI6IjIwMjUtMTItMjQgMDA6Mjg6MTUifSwiZXhwIjoxNzY2NTkzNjk1fQ.nyxdBf0AsHav6_yq_62y9wrFgmZLhKLgwaaksXPUOzc",
                "data": null,
                "error": null,
                "variables": {
                    "token111": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsInVzZXJfbmFtZSI6ImFkbWluIiwiZGVwdF9uYW1lIjoiXHU3ODE0XHU1M2QxXHU5MGU4XHU5NWU4Iiwic2Vzc2lvbl9pZCI6IjZmZjZjMzg3LWRmNzUtNGE2NS1hMmZkLTc2NThhZTE5MjE0MCIsImxvZ2luX2luZm8iOnsiaXBhZGRyIjoiMTI3LjAuMC4xIiwibG9naW5Mb2NhdGlvbiI6Ilx1NTE4NVx1N2Y1MUlQIiwiYnJvd3NlciI6IlB5dGhvbiBhaW9odHRwIDMuMTIuMTUiLCJvcyI6Ik90aGVyICIsImxvZ2luVGltZSI6IjIwMjUtMTItMjQgMDA6Mjg6MTUifSwiZXhwIjoxNzY2NTkzNjk1fQ.nyxdBf0AsHav6_yq_62y9wrFgmZLhKLgwaaksXPUOzc"
                },
                "executionTime": 0.0024061203002929688,
                "log": {
                    "token111": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsInVzZXJfbmFtZSI6ImFkbWluIiwiZGVwdF9uYW1lIjoiXHU3ODE0XHU1M2QxXHU5MGU4XHU5NWU4Iiwic2Vzc2lvbl9pZCI6IjZmZjZjMzg3LWRmNzUtNGE2NS1hMmZkLTc2NThhZTE5MjE0MCIsImxvZ2luX2luZm8iOnsiaXBhZGRyIjoiMTI3LjAuMC4xIiwibG9naW5Mb2NhdGlvbiI6Ilx1NTE4NVx1N2Y1MUlQIiwiYnJvd3NlciI6IlB5dGhvbiBhaW9odHRwIDMuMTIuMTUiLCJvcyI6Ik90aGVyICIsImxvZ2luVGltZSI6IjIwMjUtMTItMjQgMDA6Mjg6MTUifSwiZXhwIjoxNzY2NTkzNjk1fQ.nyxdBf0AsHav6_yq_62y9wrFgmZLhKLgwaaksXPUOzc"
                }
            }
        ],
        "assersionResult": {
            "success": true,
            "message": "断言执行成功 (0/0)",
            "data": null,
            "error": null,
            "variables": null,
            "executionTime": 0.0,
            "log": {
                "total": 0,
                "success": 0,
                "failed": 0,
                "results": [],
                "execution_time": 0.0
            }
        },
        "context": null,
        "log": "2025-12-24 00:28:15.432 | bf88421558b24d2a8431de0ae6c9dbd0 | INFO     | module_admin.api_testing.api_cache_data.service.cache_data_service:get_cachedata_by_key:41 - 获取缓存；environment_cache:user:1:env:1:token\n2025-12-24 00:28:15.436 | bf88421558b24d2a8431de0ae6c9dbd0 | INFO     | utils.api_tools.executors.manager:execute_setup_list:25 - 开始执行前置脚本，共0个\n2025-12-24 00:28:15.436 | bf88421558b24d2a8431de0ae6c9dbd0 | INFO     | utils.api_tools.executors.manager:_execute_list:91 - setup_type 脚本执行完成，成功: 0, 失败: 0\n2025-12-24 00:28:15.662 | bf88421558b24d2a8431de0ae6c9dbd0 | WARNING  | config.get_httpclient:on_request_end:39 - 整个请求耗时 0.226s\n2025-12-24 00:28:15.663 | bf88421558b24d2a8431de0ae6c9dbd0 | WARNING  | utils.api_tools.executors.api_request_exector:_send_request_with_info:236 - 接口发送获取响应阶段耗时0.22654032707214355\n2025-12-24 00:28:15.664 | bf88421558b24d2a8431de0ae6c9dbd0 | INFO     | utils.api_tools.executors.manager:execute_teardown_list:31 - 开始执行后置脚本，共2个\n2025-12-24 00:28:15.668 | bf88421558b24d2a8431de0ae6c9dbd0 | INFO     | utils.api_tools.executors.manager:_execute_list:77 - teardown_type 脚本执行成功: 1: 结果：{'success': True, 'message': '变量 token 提取成功，值为: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsInVzZXJfbmFtZSI6ImFkbWluIiwiZGVwdF9uYW1lIjoiXHU3ODE0XHU1M2QxXHU5MGU4XHU5NWU4Iiwic2Vzc2lvbl9pZCI6IjZmZjZjMzg3LWRmNzUtNGE2NS1hMmZkLTc2NThhZTE5MjE0MCIsImxvZ2luX2luZm8iOnsiaXBhZGRyIjoiMTI3LjAuMC4xIiwibG9naW5Mb2NhdGlvbiI6Ilx1NTE4NVx1N2Y1MUlQIiwiYnJvd3NlciI6IlB5dGhvbiBhaW9odHRwIDMuMTIuMTUiLCJvcyI6Ik90aGVyICIsImxvZ2luVGltZSI6IjIwMjUtMTItMjQgMDA6Mjg6MTUifSwiZXhwIjoxNzY2NTkzNjk1fQ.nyxdBf0AsHav6_yq_62y9wrFgmZLhKLgwaaksXPUOzc', 'data': None, 'error': None, 'variables': {'token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsInVzZXJfbmFtZSI6ImFkbWluIiwiZGVwdF9uYW1lIjoiXHU3ODE0XHU1M2QxXHU5MGU4XHU5NWU4Iiwic2Vzc2lvbl9pZCI6IjZmZjZjMzg3LWRmNzUtNGE2NS1hMmZkLTc2NThhZTE5MjE0MCIsImxvZ2luX2luZm8iOnsiaXBhZGRyIjoiMTI3LjAuMC4xIiwibG9naW5Mb2NhdGlvbiI6Ilx1NTE4NVx1N2Y1MUlQIiwiYnJvd3NlciI6IlB5dGhvbiBhaW9odHRwIDMuMTIuMTUiLCJvcyI6Ik90aGVyICIsImxvZ2luVGltZSI6IjIwMjUtMTItMjQgMDA6Mjg6MTUifSwiZXhwIjoxNzY2NTkzNjk1fQ.nyxdBf0AsHav6_yq_62y9wrFgmZLhKLgwaaksXPUOzc'}, 'execution_time': 0.003394603729248047, 'log': {'token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsInVzZXJfbmFtZSI6ImFkbWluIiwiZGVwdF9uYW1lIjoiXHU3ODE0XHU1M2QxXHU5MGU4XHU5NWU4Iiwic2Vzc2lvbl9pZCI6IjZmZjZjMzg3LWRmNzUtNGE2NS1hMmZkLTc2NThhZTE5MjE0MCIsImxvZ2luX2luZm8iOnsiaXBhZGRyIjoiMTI3LjAuMC4xIiwibG9naW5Mb2NhdGlvbiI6Ilx1NTE4NVx1N2Y1MUlQIiwiYnJvd3NlciI6IlB5dGhvbiBhaW9odHRwIDMuMTIuMTUiLCJvcyI6Ik90aGVyICIsImxvZ2luVGltZSI6IjIwMjUtMTItMjQgMDA6Mjg6MTUifSwiZXhwIjoxNzY2NTkzNjk1fQ.nyxdBf0AsHav6_yq_62y9wrFgmZLhKLgwaaksXPUOzc'}}\n2025-12-24 00:28:15.672 | bf88421558b24d2a8431de0ae6c9dbd0 | INFO     | utils.api_tools.executors.manager:_execute_list:77 - teardown_type 脚本执行成功: 1: 结果：{'success': True, 'message': '变量 token111 提取成功，值为: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsInVzZXJfbmFtZSI6ImFkbWluIiwiZGVwdF9uYW1lIjoiXHU3ODE0XHU1M2QxXHU5MGU4XHU5NWU4Iiwic2Vzc2lvbl9pZCI6IjZmZjZjMzg3LWRmNzUtNGE2NS1hMmZkLTc2NThhZTE5MjE0MCIsImxvZ2luX2luZm8iOnsiaXBhZGRyIjoiMTI3LjAuMC4xIiwibG9naW5Mb2NhdGlvbiI6Ilx1NTE4NVx1N2Y1MUlQIiwiYnJvd3NlciI6IlB5dGhvbiBhaW9odHRwIDMuMTIuMTUiLCJvcyI6Ik90aGVyICIsImxvZ2luVGltZSI6IjIwMjUtMTItMjQgMDA6Mjg6MTUifSwiZXhwIjoxNzY2NTkzNjk1fQ.nyxdBf0AsHav6_yq_62y9wrFgmZLhKLgwaaksXPUOzc', 'data': None, 'error': None, 'variables': {'token111': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsInVzZXJfbmFtZSI6ImFkbWluIiwiZGVwdF9uYW1lIjoiXHU3ODE0XHU1M2QxXHU5MGU4XHU5NWU4Iiwic2Vzc2lvbl9pZCI6IjZmZjZjMzg3LWRmNzUtNGE2NS1hMmZkLTc2NThhZTE5MjE0MCIsImxvZ2luX2luZm8iOnsiaXBhZGRyIjoiMTI3LjAuMC4xIiwibG9naW5Mb2NhdGlvbiI6Ilx1NTE4NVx1N2Y1MUlQIiwiYnJvd3NlciI6IlB5dGhvbiBhaW9odHRwIDMuMTIuMTUiLCJvcyI6Ik90aGVyICIsImxvZ2luVGltZSI6IjIwMjUtMTItMjQgMDA6Mjg6MTUifSwiZXhwIjoxNzY2NTkzNjk1fQ.nyxdBf0AsHav6_yq_62y9wrFgmZLhKLgwaaksXPUOzc'}, 'execution_time': 0.0024061203002929688, 'log': {'token111': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsInVzZXJfbmFtZSI6ImFkbWluIiwiZGVwdF9uYW1lIjoiXHU3ODE0XHU1M2QxXHU5MGU4XHU5NWU4Iiwic2Vzc2lvbl9pZCI6IjZmZjZjMzg3LWRmNzUtNGE2NS1hMmZkLTc2NThhZTE5MjE0MCIsImxvZ2luX2luZm8iOnsiaXBhZGRyIjoiMTI3LjAuMC4xIiwibG9naW5Mb2NhdGlvbiI6Ilx1NTE4NVx1N2Y1MUlQIiwiYnJvd3NlciI6IlB5dGhvbiBhaW9odHRwIDMuMTIuMTUiLCJvcyI6Ik90aGVyICIsImxvZ2luVGltZSI6IjIwMjUtMTItMjQgMDA6Mjg6MTUifSwiZXhwIjoxNzY2NTkzNjk1fQ.nyxdBf0AsHav6_yq_62y9wrFgmZLhKLgwaaksXPUOzc'}}\n2025-12-24 00:28:15.672 | bf88421558b24d2a8431de0ae6c9dbd0 | INFO     | utils.api_tools.executors.manager:_execute_list:91 - teardown_type 脚本执行完成，成功: 2, 失败: 0"
    },
    "success": true,
    "time": "2025-12-24T00:28:15.678438"
}