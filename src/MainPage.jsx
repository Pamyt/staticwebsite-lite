import React, { useState, useEffect, useRef, use, useCallback } from 'react'
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
import { APIProvider, Map, Marker, Pin, AdvancedMarker, useMap } from '@vis.gl/react-google-maps'
import { postmessage, getallconvid, getcontentbyid, getlocation } from './api'
import './MainPage.css'
import { all } from 'axios'
const { Header, Sider, Content } = Layout


const PoiMarkers = (pois) => {
    console.log("POI数据:", pois.pois)
    console.log("POI数据长度:", pois.pois.length)
    return (
        <>
            {pois.pois.length > 0 && (pois.pois.map((poi) => (
                <AdvancedMarker
                    key={poi.key}
                    position={poi.location}
                    title={poi.key}>

                    <Pin background={'#FBBC04'} glyphColor={'#000'} borderColor={'#000'} />
                    <img src="https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/pin_drop/default/48px.svg" />
                </AdvancedMarker>
            )))}
        </>
    )
}

const MapComponent = ({ locations }) => {
    const map = useMap()

    // 边界计算函数
    const calculateBounds = locations => {
        const bounds = new window.google.maps.LatLngBounds()
        locations.forEach(loc => bounds.extend(loc.location))
        return bounds
    }
    console.log("地图数据:", locations)
    console.log("地图", map)
    // 自适应逻辑
    useEffect(() => {

        if (map && locations.length !== 0) {

            const bounds = calculateBounds(locations)
            console.log("地图", map)

            map.fitBounds(bounds, {
                top: 20,
                right: 20,
                bottom: 20,
                left: 20
            })
            console.log("地图边界:", bounds)
        }
    }, [map, locations])
    // 限制最小缩放级别


}

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
    const [locations, setLocation] = useState([])
    const buttonRef = useRef(null)  // 创建 ref
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
        const locations = sessionStorage.getItem('locations')
        if (locations) {
            const parsedLocations = JSON.parse(locations)
            setLocation(parsedLocations)
        }
        const ifiscreate = sessionStorage.getItem('ifiscreate')
        const newConvId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)

        if (ifiscreate === 'true') {
            if (buttonRef.current) {
                buttonRef.current.click()
            }
            //console.log("创建新会话")
            setInputText(sessionStorage.getItem('inputText'))
            setCurrentConv(newConvId)
            //await handleSend
            sessionStorage.setItem('currentConv', newConvId)
            sessionStorage.removeItem('ifiscreate')
            sessionStorage.removeItem('inputText')
            console.log("currentConv", currentConv)
            console.log("allconvids", allConvIds)
            console.log("newConvId", newConvId)
        }
    }, []
    )

    useEffect(() => {
        scrollToBottom()
    }, [messages[currentConv], currentConv])



    const handleSend = async () => {
        console.log("当前会话ID:", currentConv)
        console.log("所有会话ID:", allConvIds)
        if (!allConvIds.includes(Number(currentConv))) {
            setAllConvIds(prev => [...prev, currentConv])
            sessionStorage.setItem('currentConv', currentConv)
        }
        if (!inputText.trim()) return

        // 添加用户消息和初始加载状态
        setMessages(prev => ({
            ...prev,
            [currentConv]: (prev[currentConv] || []).concat([
                { text: inputText, isUser: true, isLoading: false },
                { text: '', isUser: false, isLoading: true }])
        }))


        setInputText('')
        const processStream = async (reader) => {
            const decoder = new TextDecoder()
            let result = ''
            while (true) {
                const { done, value } = await reader.read()
                if (done) break

                // 处理数据分块
                const chunk = decoder.decode(value, { stream: true })
                console.log("分块数据:", chunk)
                const lines = chunk.split('\n').filter(line => line.startsWith('data: '))
                console.log("分块数据行:", lines)

                // 2. 解析JSON并拼接目标chunk

                lines.forEach(line => {
                    try {
                        const jsonStr = line.replace('data: ', '')
                        const data = JSON.parse(jsonStr)
                        console.log("解析数据:", data)
                        if (data.type === 'llm_chunk') {
                            result += data.chunk
                        }
                    } catch (e) {
                        console.error('解析失败:', e)
                    }
                })
                console.log("拼接数据:", result)
                // 更新消息状态
                setMessages(prev => {
                    const messages = prev[currentConv] || []

                    const newMessages = [...messages]
                    if (newMessages.length > 0) {
                        const lastIndex = newMessages.length - 1  // 获取最后一条的索引[1,3,7](@ref)
                        newMessages[lastIndex] = {                // 直接通过索引修改
                            ...newMessages[lastIndex],              // 保留原有属性
                            text: result,
                            isLoading: false
                        }
                    }

                    return { ...prev, [currentConv]: newMessages }
                })
            }
        }

        try {
            // 使用Fetch API发起流式请求
            const response = await fetch('https://pryevz3dwx.ap-southeast-2.awsapprunner.com/llm_talk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: inputText,
                    user_id: Number(userId),
                    conversation_id: String(currentConv)
                })
            })

            if (!response.ok) throw new Error('请求失败')

            const reader = response.body.getReader()
            await processStream(reader)

            // 获取最终位置数据（保持原有逻辑）
            const locationResponse = await getlocation(userId, currentConv)
            if (locationResponse.status === 200) {
                const locationcontent = locationResponse.data.llm_content

                const transformed = locationcontent.map(item => {
                    const [key] = Object.keys(item)
                    const [lng, lat] = item[key]

                    return {
                        key,
                        location: {
                            lat: Number(lat.toFixed(6)),
                            lng: Number(lng.toFixed(6))
                        }
                    }
                })

                setLocation(transformed)
                sessionStorage.setItem('locations', JSON.stringify(transformed))
            }
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
    }, [currentConv, allConvIds])
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
                            ref={buttonRef}
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
                                <div style={{ lineHeight: 1.2, zIndex: -1 }}>
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
                    <div style={{ flex: 1, borderRadius: 8 }}>
                        <APIProvider apiKey={'AIzaSyD8kz0EW1KKo8B3I8GU7nAy19R8S6X6RVE'}>
                            <Map
                                mapId={'tsinghua-map'}
                                defaultZoom={10}
                                gestureHandling="greedy"
                                defaultCenter={{ lat: 39.9042, lng: 116.4074 }} // 北京
                                style={{ height: '100%', width: '100%' }}>
                                <PoiMarkers pois={locations} />
                                <MapComponent locations={locations} />
                            </Map>
                        </APIProvider>
                    </div>
                </Content>
            </Layout>
        </Layout >
    )
}

export default MainPage