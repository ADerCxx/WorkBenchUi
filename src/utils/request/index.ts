import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import axios from 'axios'

import { ApiUrl } from '@/config'

const client = axios.create({
  baseURL: ApiUrl,
  timeout: 50000,
})

/** 请求参数：业务侧统一用 params，POST/PUT/PATCH 时自动转为 body */
export interface RequestConfig<P = unknown> extends AxiosRequestConfig {
  url: string
  params?: P
}

/**
 * 发起请求
 * @param options 请求配置，默认 method 为 POST
 */
export default function request<R, P = unknown>(
  options: RequestConfig<P>,
): Promise<AxiosResponse<R>> {
  const { method = 'POST', params, ...config } = options
  const finalConfig: AxiosRequestConfig = { ...config, method }

  if (['POST', 'PUT', 'PATCH'].includes(String(method).toUpperCase())) {
    finalConfig.data = params ?? {}
  }
  else {
    finalConfig.params = params
  }

  return client.request<R>(finalConfig)
}
