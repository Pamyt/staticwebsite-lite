import React, { useState, useEffect, useRef } from 'react'
import {
    TextField,
    Button,
    Typography,
    Box,
    Card,
    CardContent,
    CardActions,
    Stack
} from '@mui/material'
import { postmessage } from './api'

function MainPage () {
    // 消息列表状态（包含消息内容、方向、加载状态）
    const [messages, setMessages] = useState([])
    const [inputText, setInputText] = useState('')
    const [randomNumber, setRandomNumber] = useState(0)
    const messagesEndRef = useRef(null)

    // 自动滚动到底部
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
    useEffect(() => {
        setRandomNumber(Math.floor(101 + Math.random() * (Number.MAX_SAFE_INTEGER - 101)))
    }
        , [])
    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const MAX_RETRIES = 5 // 最大重试次数

    const handleSend = async (e) => {
        e.preventDefault()
        if (!inputText.trim()) return

        // 添加用户消息和初始加载状态
        setMessages(prev => [
            ...prev,
            { text: inputText, isUser: true, isLoading: false },
            { text: '', isUser: false, isLoading: true }
        ])

        let retryCount = 0
        let success = false
        let finalResponse = null

        // 带重试机制的请求函数
        const sendWithRetry = async () => {
            try {
                const response = await postmessage(inputText, randomNumber)
                success = true
                finalResponse = response
            } catch (error) {
                if (retryCount < MAX_RETRIES) {
                    retryCount++
                    console.log(`第 ${retryCount} 次重试...`)
                    await new Promise(resolve => setTimeout(resolve, 1000)) // 1秒延迟[4](@ref)
                    return sendWithRetry()
                } else {
                    throw error
                }
            }
        }

        try {
            await sendWithRetry()
            setMessages(prev =>
                prev.map(msg =>
                    msg.isLoading ? {
                        ...msg,
                        text: success ? finalResponse.data.llm_content : '请求失败，请重试',
                        isLoading: false
                    } : msg
                )
            )
        } catch (error) {
            setMessages(prev =>
                prev.map(msg =>
                    msg.isLoading ? {
                        ...msg,
                        text: `服务异常（已重试${MAX_RETRIES}次）`,
                        isLoading: false
                    } : msg
                )
            )
            console.error('最终请求失败:', error)
        }

        setInputText('')
    }

    // 消息气泡组件
    // 消息气泡组件修改
    // 消息气泡组件修改
    const MessageBubble = ({ text, isUser, isLoading }) => {
        return (
            <Box sx={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                mb: 2
            }}>
                <Card sx={{
                    maxWidth: '70%',
                    bgcolor: isUser ? '#2196f3' : '#e0e0e0',
                    borderRadius: isUser
                        ? '18px 18px 4px 18px'
                        : '18px 18px 18px 4px'
                }}>
                    <CardContent>
                        {isLoading ? (
                            <Typography
                                sx={{
                                    animation: 'blink 1.4s infinite',
                                    '@keyframes blink': {
                                        '0%': { opacity: 0.2 },
                                        '50%': { opacity: 1 },
                                        '100%': { opacity: 0.2 }
                                    }
                                }}
                            >
                                ...
                            </Typography>
                        ) : (
                            <Typography
                                color={isUser ? 'white' : 'text.primary'}
                                sx={{ wordBreak: 'break-word' }}
                            >
                                {text}
                            </Typography>
                        )}
                    </CardContent>
                </Card>
            </Box>
        )
    }
    return (
        <Box sx={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            p: 2
        }}>
            {/* 消息列表区域 */}
            <Box sx={{
                flex: 1,
                overflow: 'auto',
                mb: 2,
                bgcolor: '#f5f5f5',
                p: 2,
                borderRadius: 2
            }}>
                {messages.map((msg, index) => (
                    <MessageBubble
                        key={index}
                        text={msg.text}
                        isUser={msg.isUser}
                        isLoading={msg.isLoading}
                    />
                ))}
                <div ref={messagesEndRef} />
            </Box>

            {/* 输入区域 */}
            <Box
                component="form"
                onSubmit={handleSend}
                sx={{ display: 'flex', gap: 1 }}
            >
                <TextField
                    fullWidth
                    variant="outlined"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="输入消息..."
                />
                <Button
                    variant="contained"
                    type="submit"
                    disabled={!inputText.trim()}
                >
                    发送
                </Button>
            </Box>
        </Box>
    )
}

export default MainPage