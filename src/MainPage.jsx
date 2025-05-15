import React, { useState, useEffect, useRef } from 'react'
import {
    Layout,
    Button,
    Input,
    Card,
    Typography,
    Menu,
    Spin,
    Affix,
    Tooltip
} from 'antd'
import {
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    MessageOutlined,
    UserOutlined,
    RobotOutlined,
    PlusOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { APIProvider, Map } from '@vis.gl/react-google-maps'
import { postmessage, getallconvid, getcontentbyid } from './api'
import './MainPage.css'

const { Header, Sider, Content } = Layout
const { Text } = Typography

function MainPage () {
    // 状态管理
    const [collapsed, setCollapsed] = useState(false)
    const [messages, setMessages] = useState({})
    const [randomNumber, setRandomNumber] = useState(0)
    const [inputText, setInputText] = useState('')
    const navigate = useNavigate()
    const [allConvIds, setAllConvIds] = useState([])
    const [currentConv, setCurrentConv] = useState('')
    const messagesEndRef = useRef(null)
    const userId = sessionStorage.getItem('userid') || 0

    // 布局样式配置
    const layoutStyle = {
        width: '90vw',
        height: '100vh',
        overflow: 'hidden'
    }
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
    const MessageBubble = ({ text, isUser, isLoading }) => (
        <div style={{
            display: 'flex',
            justifyContent: isUser ? 'flex-end' : 'flex-start',
        }}>
            <Card
                className="custom-card"
                bordered={false}
                style={{
                    maxWidth: '70%',
                    backgroundColor: isUser ? '#1890ff' : '#f0f0f0',
                    marginTop: '15px',
                }}
                padding={1}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    color: isUser ? 'white' : 'rgba(0, 0, 0, 0.88)'
                }}>
                    {isLoading ? (
                        <Spin indicator={<span style={{ color: 'inherit' }}>...</span>} />
                    ) : (
                        <>
                            {!isUser && <RobotOutlined />}
                            <Text style={{ margin: 0, color: isUser ? 'white' : 'black' }}>{text}</Text>
                            {isUser && <UserOutlined />}
                        </>
                    )}
                </div>
            </Card>
        </div>
    )

    return (
        <Layout style={layoutStyle}>
            {/* 可折叠侧边栏 */}
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={(value) => setCollapsed(value)}
                trigger={null}
                width={150}
                collapsedWidth={55}
                style={{
                    backgroundColor: '#fff',
                    borderRight: '1px solid #f0f0f0'
                }}
            >
                <Affix offsetTop={0}>
                    <div style={{
                        padding: '16px 12px', // 左右留出8px边距
                        width: '100%',
                    }}>
                        <Tooltip title={collapsed ? "展开侧边栏" : "收起会话栏"}>
                            <Button
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    border: 'none',
                                    marginBottom: 18,
                                }}
                                onClick={() => setCollapsed(!collapsed)}
                            >
                                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                                {!collapsed && <span>缩小侧边栏</span>}
                            </Button>
                        </Tooltip>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            block
                            onClick={() => {
                                const newConvId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
                                setAllConvIds(prev => [...prev, newConvId])
                                setCurrentConv(newConvId)
                            }}
                        >
                            {!collapsed && "新建会话"}
                        </Button>
                    </div>
                </Affix>

                {/* 会话列表 */}
                <Menu
                    mode="inline"
                    selectedKeys={[String(currentConv)]}
                    onSelect={({ key }) => {
                        setCurrentConv(key)
                        console.log("当前会话ID:", key)
                        console.log("当前ID的type", typeof key)
                        console.log("allConvIds", allConvIds)
                        console.log("allConvIds的type", typeof allConvIds[0])
                        if (!messages[key]) {
                            setMessages(prev => ({ ...prev, [key]: [] }))
                        }

                    }}
                    items={allConvIds.map((convId, index) => ({
                        key: convId,
                        icon: <MessageOutlined />,
                        label: `会话 ${index + 1}`,
                        title: `ID: ${convId}`
                    }))}
                />
            </Sider>

            {/* 主内容区域 */}
            <Layout>
                <Content style={{
                    display: 'flex',
                    padding: 24,
                    gap: 24,
                    backgroundColor: '#f5f5f5'
                }}>
                    {/* 消息面板 */}
                    <div style={{
                        flex: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 16
                    }}>
                        <div style={{
                            flex: 1,
                            overflow: 'auto',
                            padding: 16,
                            backgroundColor: '#fff',
                            borderRadius: 8
                        }}>
                            {(messages[currentConv] || []).map((msg, index) => (
                                <MessageBubble
                                    key={`${currentConv}-${index}`}
                                    text={msg.text}
                                    isUser={msg.isUser}
                                    isLoading={msg.isLoading}
                                />
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* 输入区域 */}
                        <Input.Search
                            placeholder="输入消息..."
                            enterButton="发送"
                            size="large"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onSearch={handleSend}
                            allowClear
                        />
                    </div>

                    {/* 地图面板 */}
                    <div style={{ flex: 1, borderRadius: 8, overflow: 'hidden' }}>
                        <Map
                            defaultCenter={{ lat: 40.0000, lng: 116.3264 }}
                            defaultZoom={15}
                            gestureHandling="greedy"
                            mapId="tsinghua-map"
                            style={{ height: '100%' }}
                        />
                    </div>
                </Content>
            </Layout>
        </Layout>
    )
}

export default MainPage