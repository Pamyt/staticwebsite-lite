import React, { useState, useEffect, useRef, use } from 'react'
import {
    Layout,
    Button,
    Input,
    Card,
    Menu,
    Spin,
    Affix,
    Tooltip
} from 'antd'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'
import rehypeKatex from 'rehype-katex'
import remarkMath from 'remark-math'
import { Typography } from '@mui/material'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { materialDark } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import remarkGfm from 'remark-gfm'
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
        width: '100vw',
        height: '98vh',
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
            //console.log("当前会话ID:", currentConv)
            if (currentConv === "") {

                if (allconvids.length > 0) {
                    setCurrentConv(allconvids[0])

                }
                else {
                    setCurrentConv(randomNumber)
                }
            }
            const sharedConvId = sessionStorage.getItem('currentConv')
            // console.log("当前会话ID:", sharedConvId)
            //console.log("实际上的会话ID:", currentConv)
            if (sharedConvId && currentConv === "") {
                setCurrentConv(sharedConvId)
                //console.log("找到了旧ID")
            }
            //console.log("当前会话ID:", currentConv)
            //console.log("所有会话ID:", allconvids)
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

    }, []
    )
    useEffect(() => {
        const ifiscreate = sessionStorage.getItem('ifiscreate')
        const newConvId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)
        const initialize = async () => {
            if (ifiscreate === 'true') {
                //console.log("创建新会话")
                setInputText(sessionStorage.getItem('inputText'))
                await handleSend()
                setAllConvIds(prev => [...prev, newConvId])
                setCurrentConv(newConvId)
                sessionStorage.setItem('currentConv', newConvId)
                sessionStorage.removeItem('ifiscreate')
                sessionStorage.removeItem('inputText')
            }
        }
        initialize()
    }, [])
    useEffect(() => {
        scrollToBottom()
    }, [messages, currentConv])


    const MAX_RETRIES = 10 // 最大重试次数

    const handleSend = async () => {
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
        setInputText('')

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
            setMessages(prev => ({
                ...prev,
                [currentConv]: (prev[currentConv] || []).map(msg =>
                    msg.isLoading ? {
                        ...msg,
                        text: '请求失败，请重试',
                        isLoading: false
                    } : msg
                )
            }))
            console.error('最终请求失败:', error)
        }


    }
    const getLastUserMessage = (convId) => {
        const messageList = messages[convId] || []
        // 逆序查找最后一条用户消息[3,4](@ref)
        for (let i = messageList.length - 1; i >= 0; i--) {
            if (messageList[i].isUser) {
                return messageList[i].text
            }
        }
        return ''
    }
    // 消息气泡组件
    function removeMarkdownCodeBlocks (text) {
        // 匹配所有代码块（含语言声明）
        const regex = /```\s*\w*\n([\s\S]*?)```/g
        return text.replace(regex, '$1')
    }
    useEffect(() => {
        const selectedItem = document.querySelector(`[data-convid="${currentConv}"]`)
        selectedItem?.scrollIntoView({ behavior: 'smooth' })
    }, [currentConv])
    const MessageBubble = ({ text, isUser, isLoading }) => {
        const decodeUnicode = str =>
            str.replace(/\\u([\dA-F]{4})/gi, (_, code) =>
                String.fromCharCode(parseInt(code, 16))
            )
        const cleanContent = removeMarkdownCodeBlocks(decodeUnicode(text)
            .replace(/&gt;/g, '>')
            .replace(/\\n/g, '\n')
            .replace(/\\"/g, '"')
            .replace(/‘/g, "'")
            .replace(/（/g, '(')
            .replace(/）/g, ')'))

        // 增强型渲染组件
        const components = {
            h1: ({ children }) => <h1 className="markdown-h1">{children}</h1>,
            h2: ({ children }) => <h2 className="markdown-h2">{children}</h2>,
            h3: ({ children }) => <h3 className="markdown-h3">{children}</h3>,
            ul: ({ children }) => <ul className="markdown-list">{children}</ul>,
            ol: ({ children }) => <ol className="markdown-list">{children}</ol>,
            p: ({ children }) => <p className="markdown-paragraph">{children}</p>,
            blockquote: ({ children }) => (
                <blockquote className="markdown-quote">{children}</blockquote>
            ),
            code ({ node, inline, className, children }) {
                const match = /language-(\w+)/.exec(className || '')
                return !inline && match ? (
                    <div className="code-block">
                        <div className="code-language">{match[1]}</div>
                        <SyntaxHighlighter
                            style={materialDark}
                            language={match[1]}
                            PreTag="div"
                        >
                            {String(children).replace(/\n$/, '')}
                        </SyntaxHighlighter>
                    </div>
                ) : (
                    <code className="inline-code">{children}</code>
                )
            },
            a: ({ href, children }) => (
                <a href={href} target="_blank" rel="noopener noreferrer" className="markdown-link">
                    {children}
                </a>
            ),
            img: ({ src, alt }) => (
                <div className="image-container">
                    <img src={src} alt={alt} />
                    {alt && <div className="image-caption">{alt}</div>}
                </div>
            )
        }

        return <div style={{
            display: 'flex',
            justifyContent: isUser ? 'flex-end' : 'flex-start',
        }
        } >
            <Card
                className="custom-card"
                bordered={false}
                style={{
                    maxWidth: '80%',
                    backgroundColor: isUser ? '#1890ff' : '#f0f0f0',
                    marginTop: '15px',
                }}
            >
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: isUser ? 'white' : 'rgba(0, 0, 0, 0.88)'
                }}>
                    {isLoading ? (
                        <Typography
                            sx={{
                                animation: 'pulse 1.4s infinite',
                                '@keyframes pulse': {
                                    '0%, 100%': {
                                        opacity: 0.5,
                                        letterSpacing: '0.2em' // 初始间距
                                    },
                                    '50%': {
                                        opacity: 1,
                                        letterSpacing: '0.3em' // 动画峰值间距
                                    }
                                },
                                marginLeft: '5px',
                                fontSize: '28px',         // 放大字号[4,10](@ref)
                                fontWeight: 700,         // 加粗字体[6](@ref)
                                letterSpacing: '0.2em',   // 基准字符间距[9](@ref)
                                display: 'inline-flex',   // 启用弹性布局
                                gap: '0.2em'             // 增加元素间距
                            }}
                        >
                            •••
                        </Typography>
                    ) : (
                        <>
                            {!isUser && <RobotOutlined />}
                            <div className="markdown-container" style={{
                                marginLeft: isUser ? '0' : '5px',
                                marginTop: isUser ? '0' : '3px',
                                marginBottom: isUser ? '0' : '3px',
                            }}>
                                <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={components}
                                    rehypePlugins={[]}
                                    skipHtml={true}
                                >
                                    {cleanContent}
                                </ReactMarkdown>
                            </div>
                            {isUser && <UserOutlined />}
                        </>
                    )}
                </div>
            </Card >
        </div >
    }

    return (
        <Layout style={layoutStyle}>
            {/* 可折叠侧边栏 */}
            <Sider
                collapsible
                collapsed={collapsed}
                onCollapse={(value) => setCollapsed(value)}
                trigger={null}
                width={150}
                overflow="auto"
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
                                    outline: 'none !important', // 强制覆盖所有状态
                                    WebkitAppearance: 'none',   // 移除iOS/Safari默认样式
                                    MozAppearance: 'none',      // 移除Firefox默认样式
                                    // 针对Firefox特殊处理
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
                                sessionStorage.setItem('currentConv', newConvId)
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
                        sessionStorage.setItem('currentConv', key)
                        if (!messages[key]) {
                            setMessages(prev => ({ ...prev, [key]: [] }))
                        }

                    }}
                    style={{
                        overflow: 'auto',
                        maxHeight: '79vh',
                    }}
                    overflow="auto"
                    scroll={{ scrollToSelected: true }}
                    items={allConvIds.map((convId, index) => ({
                        key: convId,
                        icon: <MessageOutlined />,
                        label: (
                            <div data-convid={convId}>
                                <div style={{ lineHeight: 1.2 }}>
                                    <div style={{ fontWeight: 500 }}>会话 {index + 1}</div>
                                    <span style={{
                                        fontSize: 10,
                                        color: '#666',
                                        display: 'inline-block',
                                        width: '100%',
                                        height: '1.2em',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}>
                                        {getLastUserMessage(convId)}
                                    </span>
                                </div></div>
                        ),
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