import { Card, Form, Input, Button, Spin, message } from 'antd'
import { UserOutlined, LockOutlined, LoginOutlined, UserAddOutlined, SwapOutlined } from '@ant-design/icons'
import ReactCardFlip from 'react-card-flip'
import React, { useState } from 'react'
import { login, register } from './api.jsx'
const AuthCard = ({ }) => {
    const [loginForm] = Form.useForm()
    const [registerForm] = Form.useForm()
    const [loading, setLoading] = useState(false)

    // 登录验证规则
    const loginRules = [
        { required: true, message: '请输入用户名' },
        { min: 3, message: '用户名至少3位' }
    ]

    // 注册验证规则
    const registerRules = [
        { required: true, message: '请输入密码' },
        { min: 6, message: '密码至少6位' },
        ({ getFieldValue }) => ({
            validator (_, value) {
                if (!value || getFieldValue('password') === value) return Promise.resolve()
                return Promise.reject(new Error('两次输入密码不一致'))
            }
        })
    ]
    const [isFlipped, setIsFlipped] = useState(false)
    const [errors, setErrors] = useState({})
    const [isLoading, setIsLoading] = useState(false)


    const handleLogin = async (values) => {

        setIsLoading(true)
        try {
            const { data } = await login(values.username, values.password)

            sessionStorage.setItem('userid', data.user_id)
            sessionStorage.setItem('username', values.username)
            window.location.href = '/mainpage'
        } catch (error) {
            setErrors({
                form: error.response?.data?.message || '登录失败，请检查凭证'
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleRegister = async (values) => {

        setIsLoading(true)
        try {
            const { data } = await register(values.username, values.password)

            setIsFlipped(false)
            setErrors({})
        } catch (error) {
            setErrors({
                form: error.response?.data?.message || '注册失败，用户名可能已被使用'
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100vw',
            minHeight: '100vh',  // 关键属性[1,2,9](@ref)
        }}>
            <ReactCardFlip
                isFlipped={isFlipped}
                flipDirection="horizontal"
                style={{ width: "100vw", height: '100%', flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
                {/* 登录卡片 */}
                <Card
                    title={
                        <div className="card-header">
                            <LoginOutlined style={{ fontSize: 24, marginRight: 8 }} />
                            <span>用户登录</span>
                        </div>
                    }
                    extra={
                        <Button
                            type="link"
                            icon={<SwapOutlined />}
                            onClick={() => setIsFlipped(true)}
                        >
                            去注册
                        </Button>
                    }
                    className="auth-card"
                    hoverable
                >
                    <Form form={loginForm} onFinish={handleLogin}>
                        <Form.Item name="username" rules={loginRules}>
                            <Input
                                prefix={<UserOutlined />}
                                placeholder="请输入用户名"
                                allowClear
                            />
                        </Form.Item>
                        <Form.Item name="password" rules={loginRules}>
                            <Input.Password
                                prefix={<LockOutlined />}
                                placeholder="请输入密码"
                            />
                        </Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            loading={loading}
                            icon={<LoginOutlined />}
                        >
                            立即登录
                        </Button>
                    </Form>
                </Card>

                {/* 注册卡片 */}
                <Card
                    title={
                        <div className="card-header">
                            <UserAddOutlined style={{ fontSize: 24, marginRight: 8 }} />
                            <span>新用户注册</span>
                        </div>
                    }
                    extra={
                        <Button
                            type="link"
                            icon={<SwapOutlined />}
                            onClick={() => setIsFlipped(false)}
                        >
                            去登录
                        </Button>
                    }
                    className="auth-card"
                    hoverable
                >
                    <Form form={registerForm} onFinish={handleRegister}>
                        <Form.Item name="username" rules={loginRules}>
                            <Input
                                prefix={<UserOutlined />}
                                placeholder="请输入用户名"
                                allowClear
                            />
                        </Form.Item>
                        <Form.Item name="password" rules={registerRules}>
                            <Input.Password
                                prefix={<LockOutlined />}
                                placeholder="设置登录密码"
                            />
                        </Form.Item>
                        <Form.Item name="confirm" dependencies={['password']}>
                            <Input.Password
                                prefix={<LockOutlined />}
                                placeholder="确认密码"
                            />
                        </Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            block
                            loading={loading}
                            icon={<UserAddOutlined />}
                        >
                            立即注册
                        </Button>
                    </Form>
                </Card>
            </ReactCardFlip></div>
    )
}
export default AuthCard