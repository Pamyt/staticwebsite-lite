import React, { useState } from 'react'
import ReactCardFlip from 'react-card-flip'
import { CircularProgress } from '@mui/material'
import './LoginPage.css'
import { motion } from 'framer-motion'
import { login, register } from './api.jsx'
const LoginPage = () => {
    const [isFlipped, setIsFlipped] = useState(false)
    const [loginData, setLoginData] = useState({ username: '', password: '' })
    const [registerData, setRegisterData] = useState({ username: '', password: '' })
    const [errors, setErrors] = useState({})
    const [isLoading, setIsLoading] = useState(false)

    const validateForm = (type) => {
        const newErrors = {}
        const data = type === 'login' ? loginData : registerData

        if (!data.username.trim()) newErrors.username = '用户名不能为空'
        if (!data.password.trim()) newErrors.password = '密码不能为空'
        if (type === 'register' && data.password.length < 6) {
            newErrors.password = '密码至少6位'
        }

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        if (!validateForm('login')) return

        setIsLoading(true)
        try {
            const { data } = await login(loginData.username, loginData.password)

            sessionStorage.setItem('userid', data.user_id)
            window.location.href = '/'
        } catch (error) {
            setErrors({
                form: error.response?.data?.message || '登录失败，请检查凭证'
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleRegister = async (e) => {
        e.preventDefault()
        if (!validateForm('register')) return

        setIsLoading(true)
        try {
            const { data } = await register(registerData.username, registerData.password)

            sessionStorage.setItem('userid', data.userId)
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
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="login-container"
        >
            <ReactCardFlip
                isFlipped={isFlipped}
                flipDirection="horizontal"
                containerStyle={{ perspective: '1000px' }}
            >
                {/* 登录卡片 */}
                <div className="auth-card">
                    <form onSubmit={handleLogin}>
                        <h2>欢迎登录</h2>
                        {errors.form && <div className="global-error">⚠️ {errors.form}</div>}
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="用户名"
                                value={loginData.username}
                                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                            />
                            {errors.username && <span className="error">{errors.username}</span>}
                        </div>
                        <div className="input-group">
                            <input
                                type="password"
                                placeholder="密码"
                                value={loginData.password}
                                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                            />
                            {errors.password && <span className="error">{errors.password}</span>}
                        </div>
                        <button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <CircularProgress size={20} style={{ marginRight: 8 }} />
                                    登录中...
                                </>
                            ) : '登录'}
                        </button>
                        <div className="flip-switch-container">
                            <button
                                type="button"
                                className="flip-button"
                                onClick={() => setIsFlipped(!isFlipped)}
                            >
                                <span className="flip-label">切换至{isFlipped ? "登录" : "注册"}</span>
                                <svg className="flip-arrow" viewBox="0 0 24 24">
                                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>

                {/* 注册卡片 */}
                <div className="auth-card">
                    <form onSubmit={handleRegister}>
                        <h2>用户注册</h2>
                        {errors.form && <div className="global-error">⚠️ {errors.form}</div>}
                        <div className="input-group">
                            <input
                                type="text"
                                placeholder="创建用户名"
                                value={registerData.username}
                                onChange={(e) => setRegisterData({ ...registerData, username: e.target.value })}
                            />
                            {errors.username && <span className="error">{errors.username}</span>}
                        </div>
                        <div className="input-group">
                            <input
                                type="password"
                                placeholder="设置密码（至少6位）"
                                value={registerData.password}
                                onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                            />
                            {errors.password && <span className="error">{errors.password}</span>}
                        </div>
                        <button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <CircularProgress size={20} style={{ marginRight: 8 }} />
                                    注册中...
                                </>
                            ) : '注册'}
                        </button>
                        <div className="flip-switch-container">

                            <button
                                type="button"
                                className="flip-button"
                                onClick={() => setIsFlipped(!isFlipped)}
                            >
                                <span className="flip-label">切换至{isFlipped ? "登录" : "注册"}</span>
                                <svg className="flip-arrow" viewBox="0 0 24 24">
                                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                                </svg>
                            </button>
                        </div>
                    </form>
                </div>
            </ReactCardFlip>
        </motion.div>
    )
}
export default LoginPage