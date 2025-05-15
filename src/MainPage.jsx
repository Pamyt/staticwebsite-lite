import React, { useState, useEffect, useRef } from 'react'
import {
    TextField,
    Button,
    Typography,
    Box,
    Card,
    CardContent,
    CardActions,
    Stack,
    List,
    ListItem,
    ListItemText,
    ListItemButton,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { APIProvider, Map } from '@vis.gl/react-google-maps'
import { postmessage, getallconvid, getcontentbyid } from './api'


function MainPage () {
    // 消息列表状态（包含消息内容、方向、加载状态）
    const [messages, setMessages] = useState({})
    const [inputText, setInputText] = useState('')
    const navigate = useNavigate()
    const [randomNumber, setRandomNumber] = useState(0)
    const messagesEndRef = useRef(null)
    const [allConvIds, setAllConvIds] = useState([])
    const [currentConv, setCurrentConv] = useState('')
    const userId = useState(sessionStorage.getItem('userid')) ? sessionStorage.getItem('userid') : 0

    // 自动滚动到底部
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
    useEffect(() => {
        const initialize = async () => {
            setRandomNumber(Math.floor(101 + Math.random() * (Number.MAX_SAFE_INTEGER - 101)))
            if (!sessionStorage.getItem('userid'))
                navigate('/login')

            const response = await getallconvid(userId)
            let allconvids = []
            if (response.status === 200) {
                allconvids = response.data.conversation_ids
                setAllConvIds(allconvids)
            }
            if (allconvids.length > 0) {
                setCurrentConv(allconvids[0])
            }
            else {
                setCurrentConv(randomNumber)
            }
            console.log("所有会话ID:", allconvids)
            for (let i = 0; i < allconvids.length; i++) {
                const convid = allconvids[i]
                const response = getcontentbyid(userId, convid)
                response.then(res => {
                    if (res.status === 200) {
                        setMessages(prev => ({
                            ...prev,
                            [convid]: res.data.messages.map(msg => ({
                                text: msg.content,
                                isUser: msg.role === 'user',
                                isLoading: false
                            }))
                        }))
                    } else {
                        console.error('获取消息失败:', res.statusText)
                    }
                }).catch(error => {
                    console.error('请求失败:', error)
                })
            }
        }
        initialize()
    }
        , [])
    useEffect(() => {
        scrollToBottom()
    }, [messages, currentConv])

    const MAX_RETRIES = 5 // 最大重试次数

    const handleSend = async (e) => {
        e.preventDefault()
        if (!inputText.trim()) return

        // 添加用户消息和初始加载状态
        setMessages(prev => ({
            ...prev,
            [currentConv]: (prev[currentConv] || []).concat([
                { text: inputText, isUser: true, isLoading: false },
                { text: '', isUser: false, isLoading: true }])
        }))

        let retryCount = 0
        let success = false
        let finalResponse = null

        // 带重试机制的请求函数
        const sendWithRetry = async () => {
            try {
                const response = await postmessage(inputText, userId, currentConv)
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
            setInputText('')
            setMessages(prev => ({
                ...prev,
                [currentConv]: (prev[currentConv] || []).map(msg =>
                    msg.isLoading ? {
                        ...msg,
                        text: success ? finalResponse.data.llm_content : '请求失败，请重试',
                        isLoading: false
                    } : msg
                )
            }))
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
            width: '100vw',
            display: 'flex',
            gap: 2,
            p: 2
        }}>
            <Box sx={{
                flex: 2, // 20%宽度
                borderRight: '1px solid #ddd',
                overflow: 'auto',
                bgcolor: 'background.paper'
            }}>
                <Box sx={{ p: 2, borderBottom: '1px solid #ddd' }}>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={() => {
                            const newConvId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
                            setAllConvIds(prev => [...prev, newConvId])
                            setCurrentConv(newConvId)
                        }}
                    >
                        新建会话
                    </Button>
                </Box>

                {/* 会话列表 */}
                <List>
                    {allConvIds.map((convId, index) => (
                        <ListItemButton
                            key={convId}
                            selected={convId === currentConv}
                            onClick={() => {
                                setCurrentConv(convId)
                                if (!messages[convId]) {
                                    // 初始化空会话
                                    setMessages(prev => ({
                                        ...prev,
                                        [convId]: []
                                    }))
                                }
                            }}
                            sx={{
                                '&.Mui-selected': {
                                    bgcolor: '#e3f2fd'
                                }
                            }}
                        >
                            <ListItemText
                                primary={`会话 ${index + 1}`}
                                secondary={`ID: ${convId}`}
                            />
                        </ListItemButton>
                    ))}
                </List>
            </Box>
            <Box sx={{
                flex: 8,       // 70%宽度
                display: 'flex',
                flexDirection: 'column',
                bgcolor: '#f5f5f5',
                borderRadius: 2
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
                    {(messages[currentConv] || []).map((msg, index) => (
                        <MessageBubble
                            key={`${currentConv}-${index}`} // 🚩 复合key避免冲突[4](@ref)
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
                </Box></Box>
            <Box sx={{
                flex: 4,       // 30%宽度
                height: '100%',
                borderRadius: 2,
                overflow: 'hidden' // 隐藏地图溢出
            }}>
                <Map
                    defaultCenter={{ lat: 40.0000, lng: 116.3264 }} // 清华主楼坐标[7](@ref)
                    defaultZoom={15}
                    gestureHandling="greedy"
                    mapId="tsinghua-map"
                    style={{ height: '100%' }}
                >
                </Map>
            </Box>
        </Box>
    )
}

export default MainPage