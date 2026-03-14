import request from '@/utils/request'

// 上传文件
export function uploadFile(data) {
  return request({
    url: '/folder/upload',
    method: 'post',
    headers: { 'Content-type': 'multipart/form-data' },
    data: data
  })
}
