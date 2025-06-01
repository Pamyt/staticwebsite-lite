import React, { useState, useEffect, useRef } from 'react'
import {
    Layout,
    Button,
    Input,
    Card,
    Menu,
    Spin,
    Popover,
    Row,
    Col,
    Tag,
    Divider,
    Switch,
    Affix,
    Dropdown,
    Tooltip,
    Modal,
    DatePicker
} from 'antd'
import { ArrowRightOutlined, } from '@ant-design/icons'
import { AiFillStar } from 'react-icons/ai'
import { MdPlace } from 'react-icons/md' // 扁平风格的位置图标
import './HotelCards.css' // 引入自定义样式
import moment from 'moment'
import ReactMarkdown from 'react-markdown'
import { Typography } from '@mui/material'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import remarkGfm from 'remark-gfm'
import ReactCardFlip from 'react-card-flip'
import {
    MenuUnfoldOutlined,
    MenuFoldOutlined,
    MessageOutlined,
    UserOutlined,
    RobotOutlined,
    PlusOutlined,
    LoadingOutlined,
    SearchOutlined,
    RocketOutlined,
    HomeOutlined,
    EnvironmentOutlined,
    FileDoneOutlined,
} from '@ant-design/icons'
import { useMapsLibrary } from '@vis.gl/react-google-maps'
import { useNavigate } from 'react-router-dom'
import { flushSync } from 'react-dom'
import { APIProvider, Map, Marker, Pin, AdvancedMarker, useMap } from '@vis.gl/react-google-maps'
import { postdeepsearch, getallconvid, getdsconvid, getdscontentbyid, getcontentbyid, getlocation, getlocationdeepsearch, API_BASE_URL } from './api'
import './MainPage.css'
import { padding } from '@mui/system'
const { Header, Sider, Content } = Layout




const PoiMarkers = (pois) => {
    console.log("POI原数据", pois)

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

    const placesLibrary = useMapsLibrary('places')

    // 边界计算函数
    const calculateBounds = locations => {
        const bounds = new window.google.maps.LatLngBounds()
        locations.forEach(loc => bounds.extend(loc.location))
        return bounds
    }
    // 自适应逻辑
    useEffect(() => {
        if (map && locations.length !== 0) {
            const bounds = calculateBounds(locations)

            map.fitBounds(bounds, {
                top: 20,
                right: 20,
                bottom: 20,
                left: 20
            })
        }
    }, [map, placesLibrary, locations])
    // 限制最小缩放级别


}

function MainPage () {
    // 状态管理
    const [collapsed, setCollapsed] = useState(false)
    const [deepSearchInputs, setDeepSearchInputs] = useState({
        destination: '',
        startpoint: '',
        date: '',
        preference: ''
    })
    const [isDeepSearch, setIsDeepSearch] = useState({})
    const [messages, setMessages] = useState({})
    const [randomNumber, setRandomNumber] = useState(0)
    const [currentLocation, setCurrentLocation] = useState(null)
    const [inputText, setInputText] = useState('')
    const navigate = useNavigate()
    const [isLoadingState, setIsLoadingState] = useState(false)
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
    const DateRangePicker = () => {
        // 处理日期范围变化
        const handleDateChange = (dates, dateStrings) => {
            if (dates && dates[0] && dates[1]) {
                // 将两个日期用逗号拼接
                const formattedValue = `${dateStrings[0]},${dateStrings[1]}`
                setDeepSearchInputs(v => ({ ...v, date: formattedValue }))
            } else {
                setDeepSearchInputs(v => ({ ...v, date: '' }))
            }
        }

        // 将字符串值转换为 DatePicker 需要的 moment 对象数组
        const getDateRangeValue = () => {
            if (!deepSearchInputs.date) return null

            const [startStr, endStr] = deepSearchInputs.date.split(',')
            return [
                moment(startStr, 'YYYY-MM-DD'),
                moment(endStr, 'YYYY-MM-DD')
            ]
        }

        return (
            <DatePicker.RangePicker
                placeholder={['开始日期', '结束日期']}
                value={getDateRangeValue()}
                onChange={handleDateChange}
                format="YYYY-MM-DD"
                style={{ width: '100%' }}
                allowClear
            />
        )
    }
    useEffect(() => {
        const initializeAllConvs = async () => {
            try {
                // 1. 公共前置逻辑
                setRandomNumber(Math.floor(101 + Math.random() * (Number.MAX_SAFE_INTEGER - 101)))
                if (!sessionStorage.getItem('userid')) {
                    navigate('/login')
                    return
                }

                // 2. 并行请求数据（网页5推荐方案）
                const [normalRes, deepRes] = await Promise.all([
                    getallconvid(userId),
                    getdsconvid(userId)
                ])

                // 3. 合并会话数据
                const allConvs = [
                    ...(normalRes.status === 200 ? normalRes.data.conversation_ids : []),
                    ...(deepRes.status === 200 ? deepRes.data.conversation_ids : [])
                ]

                // 4. 原子化状态更新（网页8推荐方案）
                setAllConvIds(prev => [...new Set([...prev, ...allConvs])]) // 去重合并

                setIsDeepSearch(prev => {
                    const newState = { ...prev }
                    // 标记会话类型
                    normalRes.data?.conversation_ids?.forEach(id => newState[id] = 0)
                    deepRes.data?.conversation_ids?.forEach(id => newState[id] = 1)
                    return newState
                })

                // 5. 当前会话处理
                const sharedConvId = sessionStorage.getItem('currentConv')
                const currentId = sharedConvId || allConvs[0] || randomNumber
                setCurrentConv(currentId)

                // 6. 批量获取消息（网页5建议的防内存泄漏方案）
                const controller = new AbortController()
                allConvs.forEach(convid => {
                    const isDeep = deepRes.data?.conversation_ids?.includes(convid)
                    const fetcher = isDeep ? getdscontentbyid : getcontentbyid

                    fetcher(userId, convid, { signal: controller.signal }).then(res => {
                        if (res.status === 200) {
                            setMessages(prev => ({
                                ...prev,
                                [convid]: isDeep ? [{
                                    destination: res.data.destination,
                                    startpoint: res.data.startpoint,
                                    date: res.data.dates,
                                    preference: res.data.preferences,
                                    isUser: true,
                                    isLoading: false,
                                    isDeep: true
                                }, {
                                    tool_results: res.data.tool_results,
                                    agent_results: res.data.agent_results,
                                    isUser: false,
                                    isLoading: false,
                                    isDeep: true
                                }] : res.data.messages.map(msg => ({
                                    text: msg.content,
                                    isUser: msg.role === 'user',
                                    isLoading: false,
                                    isDeep: false // 默认值为false
                                }))
                            }))
                        }
                    }).catch(e => {
                        if (e.name !== 'AbortError') console.error('请求失败:', e)
                    })
                })

                return () => controller.abort() // 清理函数
            } catch (error) {
                console.error('初始化失败:', error)
            }
        }

        //initialize()
        //initialize_deepsearch()
        initializeAllConvs()
        const locations = sessionStorage.getItem('locations')
        if (locations) {
            console.log("从sessionStorage获取位置数据")
            const parsedLocations = JSON.parse(locations)
            console.log("解析后的位置数据", parsedLocations)
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
        }
    }, []
    )
    // 使用示例

    // 输出：中国北京市海淀区蓝旗营清华路

    const handleCreateConv = (type) => {
        const newConvId = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)

        // 更新会话列表
        setAllConvIds(prev => [...prev, newConvId])

        // 设置会话类型
        setIsDeepSearch(prev => ({
            ...prev,
            [newConvId]: type === 'deep' ? 1 : 0
        }))

        // 激活新会话
        setCurrentConv(newConvId)
        sessionStorage.setItem('currentConv', newConvId)
    }
    useEffect(() => {
        scrollToBottom()
    }, [messages[currentConv], currentConv])




    const handleSend = async () => {
        if (!isDeepSearch[currentConv]) {
            if (!allConvIds.includes(Number(currentConv))) {
                setAllConvIds(prev => [...prev, currentConv])
                sessionStorage.setItem('currentConv', currentConv)
            }
            if (!inputText.trim()) return

            // 添加用户消息和初始加载状态
            setMessages(prev => ({
                ...prev,
                [currentConv]: (prev[currentConv] || []).concat([
                    { text: inputText, isUser: true, isLoading: false, isDeep: false },
                    { text: '', isUser: false, isLoading: true, isDeep: false }])
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
                    const lines = chunk.split('\n').filter(line => line.startsWith('data: '))

                    // 2. 解析JSON并拼接目标chunk

                    lines.forEach(line => {
                        try {
                            const jsonStr = line.replace('data: ', '')
                            const data = JSON.parse(jsonStr)
                            if (data.type === 'llm_chunk') {
                                result += data.chunk
                            }
                        } catch (e) {
                            console.error('解析失败:', e)
                        }
                    })
                    // 更新消息状态
                    setMessages(prev => {
                        const messages = prev[currentConv] || []

                        const newMessages = [...messages]
                        if (newMessages.length > 0) {
                            const lastIndex = newMessages.length - 1  // 获取最后一条的索引[1,3,7](@ref)
                            newMessages[lastIndex] = {                // 直接通过索引修改
                                ...newMessages[lastIndex],              // 保留原有属性
                                text: result,
                                isLoading: false,
                                isDeep: false
                            }
                        }

                        return { ...prev, [currentConv]: newMessages }
                    })
                }
            }

            try {
                // 使用Fetch API发起流式请求
                const response = await fetch(`${API_BASE_URL}/llm_talk`, {
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
                flushSync(() => {
                    setIsLoadingState(true)
                })
                console.log("loading开始")
                const locationResponse = await getlocation(userId, currentConv)
                flushSync(() => {
                    setIsLoadingState(false)
                })
                console.log("loading结束")
                if (locationResponse.status === 200) {
                    const locationcontent = Object.values(locationResponse.data.geo_info)
                    console.log("位置数据", locationcontent)

                    const transformed = locationcontent.flatMap(item =>
                        item.map(poi => {
                            console.log("POI数据", poi)
                            return {
                                key: poi.name,
                                location: {
                                    lat: Number(poi.latitude.toFixed(6)),
                                    lng: Number(poi.longitude.toFixed(6))
                                }
                            }
                        })
                    )
                    console.log("转换后的位置数据", transformed)

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
                            isLoading: false,
                            isDeep: false
                        } : msg
                    )
                }))
                console.error('最终请求失败:', error)
            }
        }
        else {
            // 深度搜索逻辑
            if (!deepSearchInputs.destination.trim()) {
                alert('请输入目的地')
                return
            }
            if (!deepSearchInputs.startpoint.trim()) {
                alert('请输入出发地')
                return
            }
            if (!deepSearchInputs.date.trim()) {
                alert('请输入日期')
                return
            }
            if (!deepSearchInputs.preference.trim()) {
                alert('请输入偏好')
                return
            }

            setMessages(prev => ({
                ...prev,
                [currentConv]: (prev[currentConv] || []).concat([
                    {
                        destination: deepSearchInputs.destination,
                        startpoint: deepSearchInputs.startpoint,
                        date: deepSearchInputs.date,
                        preference: deepSearchInputs.preference,
                        isUser: true, isLoading: false, isDeep: true
                    },
                    { text: '', isUser: false, isLoading: true, isDeep: true }])
            }))

            setDeepSearchInputs({
                destination: '',
                budget: '',
                date: '',
                preference: ''
            })
            console.log("当前location", currentLocation)
            const response = await postdeepsearch(userId, currentConv, deepSearchInputs.destination, "budget", deepSearchInputs.date, deepSearchInputs.preference, deepSearchInputs.startpoint)
            if (response.status === 200) {
                const data = response.data
                setMessages(prev => ({
                    ...prev,
                    [currentConv]: (prev[currentConv] || []).map(msg =>
                        msg.isLoading ? { ...msg, tool_results: data.tool_results, agent_results: data.agent_results, isLoading: false, isDeep: true } : msg
                    )
                }))
                flushSync(() => {
                    setIsLoadingState(true)
                })
                const locationResponse = await getlocationdeepsearch(userId, currentConv)
                flushSync(() => {
                    setIsLoadingState(false)
                })
                if (locationResponse.status === 200) {
                    const locationcontent = Object.values(locationResponse.data.geo_info)

                    const transformed = locationcontent.map(item => {

                        return {
                            key: item.name,
                            location: {
                                lat: Number(item.latitude.toFixed(6)),
                                lng: Number(item.longitude.toFixed(6))
                            }
                        }
                    })

                    setLocation(transformed)
                    sessionStorage.setItem('locations', JSON.stringify(transformed))
                }
            } else {
                console.error('深度搜索请求失败:', response.statusText)
            }
        }

    }

    const MessageBubble = ({ text, destination, startpoint, date, preference, tool_results, agent_results, isUser, isLoading, isDeep }) => {
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
        const decodeUnicode = str =>
            str.replace(/\\u([\dA-F]{4})/gi, (_, code) =>
                String.fromCharCode(parseInt(code, 16))
            )

        const cleanContent = ({ text }) => {
            return removeMarkdownCodeBlocks(decodeUnicode(text)
                .replace(/&gt;/g, '>')
                .replace(/\\n/g, '\n')
                .replace(/\\"/g, '"')
                .replace(/‘/g, "'")
                .replace(/（/g, '(')
                .replace(/）/g, ')'))
        }
        if (!isDeep || isLoading) {



            // 增强型渲染组件

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
                                        {cleanContent({ text: text })}
                                    </ReactMarkdown>
                                </div>
                                {isUser && <UserOutlined />}
                            </>
                        )}
                    </div>
                </Card >
            </div >
        }
        else {
            if (isUser) {
                return (
                    <div style={{
                        padding: 16,
                        display: 'flex',
                        backgroundColor: '#fff',
                        borderRadius: 8,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        marginTop: '15px',
                        justifyContent: 'flex-end', // 右对齐[7](@ref)
                        flexDirection: 'row',
                        marginLeft: 'auto',
                        maxWidth: '80%'
                    }}>
                        {/* 大卡片容器 */}
                        <div style={{

                            display: 'flex',
                            justifyContent: 'space-between',
                            gap: 12,
                            flexWrap: 'wrap', // 允许换行[8](@ref)
                            margin: '5px',
                        }}>
                            {/* 目的地卡片 */}
                            <div style={{
                                flexBasis: '45%',
                                padding: 12,
                                background: '#f8f9fa',
                                borderRadius: 6,
                                minWidth: 200
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span style={{ color: '#6c757d' }}>目的地</span>
                                    <strong>{destination || '未指定'}</strong>
                                </div>
                            </div>

                            {/* 预算卡片 */}
                            <div style={{
                                flexBasis: '45%',
                                padding: 12,
                                background: '#f8f9fa',
                                borderRadius: 6,
                                minWidth: 200
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span style={{ color: '#6c757d' }}>出发地</span>
                                    <strong>{startpoint ? `${startpoint}` : '不限'}</strong>
                                </div>
                            </div>

                            {/* 日期卡片 */}
                            <div style={{
                                flexBasis: '45%',
                                padding: 12,
                                background: '#f8f9fa',
                                borderRadius: 6,
                                minWidth: 200
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span style={{ color: '#6c757d' }}>日期</span>
                                    <strong>{date || '未指定'}</strong>
                                </div>
                            </div>

                            {/* 偏好卡片 */}
                            <div style={{
                                flexBasis: '45%',
                                padding: 12,
                                background: '#f8f9fa',
                                borderRadius: 6,
                                minWidth: 200
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span style={{ color: '#6c757d' }}>偏好</span>
                                    <strong>{preference || '无'}</strong>
                                </div>
                            </div>
                        </div>
                    </div >
                )
            }
            else {
                //处理工具结果卡片渲染（网页1卡片布局）
                // 处理工具结果卡片渲染（修复数据遍历问题）
                const renderToolResults = () => {
                    return (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'row',
                            flexWrap: 'wrap',
                            gap: 12,
                            marginTop: 16
                        }}>
                            {/* 添加空值保护[1,6](@ref) */}
                            {tool_results?.filter(Boolean).flat().map((tool, index) => (
                                ((tool && tool.title && tool.description && tool.url) &&
                                    <div
                                        key={`tool-${tool.id || index}`}
                                        style={{
                                            flex: '1 1 30%',
                                            minWidth: 280,
                                            maxWidth: 320,
                                            borderRadius: 12,
                                            backgroundColor: '#ffffff',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                                            boxSizing: 'border-box',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            overflow: 'hidden',
                                            transition: 'transform 0.3s, box-shadow 0.3s',
                                            ':hover': {
                                                transform: 'translateY(-4px)',
                                                boxShadow: '0 8px 20px rgba(0,0,0,0.12)'
                                            }
                                        }}
                                    >
                                        {/* 图片区域 - 顶部贴合边缘 */}
                                        <div style={{
                                            position: 'relative',
                                            height: 160,
                                            backgroundColor: '#f8f9fa',
                                        }}>
                                            <img
                                                src={`https://s0.wp.com/mshots/v1/${encodeURIComponent(tool.url)}?w=4000&h=3000`}
                                                alt="网页预览"
                                                style={{
                                                    width: '100%',
                                                    height: '100%',
                                                    objectFit: 'cover',
                                                    display: 'block'
                                                }}
                                            />
                                        </div>

                                        {/* 内容区域 */}
                                        <div style={{ padding: 16 }}>
                                            {/* 标题区域 - 可点击跳转 */}
                                            <a
                                                href={tool.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{
                                                    display: 'block',
                                                    textDecoration: 'none',
                                                    marginBottom: 8 // 为域名留出空间
                                                }}
                                            >
                                                <h4 style={{
                                                    margin: 0,
                                                    fontSize: 16,
                                                    fontWeight: 600,
                                                    color: '#1a1a1a',
                                                    lineHeight: 1.4,
                                                    transition: 'color 0.2s',
                                                    ':hover': {
                                                        color: '#1890ff' // 添加悬停颜色变化
                                                    }
                                                }}>
                                                    {tool.title}
                                                </h4>
                                            </a>

                                            {/* 域名显示 - 移动到标题下方，灰色小字 */}
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                color: '#718096', // 中灰色,
                                                opacity: 0.8,
                                                fontSize: 12,
                                                marginTop: 4
                                            }}>
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ marginRight: 4 }}>
                                                    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="#718096" strokeWidth="2" strokeLinecap="round" />
                                                    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="#718096" strokeWidth="2" strokeLinecap="round" />
                                                </svg>
                                                {new URL(tool.url).hostname}
                                            </div>
                                        </div>
                                    </div>)
                            ))
                            }
                        </div >
                    )
                }

                const FlightCard = ({ flightData }) => {
                    // 提取航班数据
                    const flightArray = Object.values(flightData[0].airplane.from_to_flight1)
                    const returnArray = Object.values(flightData[0].airplane.from_to_flight2)

                    // 航班段组件（支持联程）
                    const FlightSegment = ({ segment }) => {
                        // 处理联程航班
                        const flights = Array.isArray(segment) ? segment : [segment]

                        return (
                            <div style={{
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px', // 航段之间的间距
                            }}>
                                {flights.map((flight, idx) => (
                                    <React.Fragment key={idx}>
                                        {/* 单个航段 */}
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '12px',
                                            backgroundColor: '#fafafa',
                                            borderRadius: '6px'
                                        }}>
                                            {/* 出发信息 */}
                                            <div style={{ textAlign: 'center', minWidth: 80 }}>
                                                <div style={{ fontSize: 16, fontWeight: 600 }}>
                                                    {flight.dep_time.split(' ')[1].substring(0, 5)}
                                                </div>
                                                <div style={{ fontSize: 12, color: '#666' }}>
                                                    {flight.origin.iata_code}
                                                </div>
                                            </div>

                                            {/* 箭头连接 */}
                                            <div style={{ margin: '0 8px', color: '#1890ff' }}>
                                                <ArrowRightOutlined style={{ transform: 'rotate(0deg)' }} />
                                            </div>

                                            {/* 到达信息 */}
                                            <div style={{ textAlign: 'center', minWidth: 80 }}>
                                                <div style={{ fontSize: 16, fontWeight: 600 }}>
                                                    {flight.arr_time.split(' ')[1].substring(0, 5)}
                                                </div>
                                                <div style={{ fontSize: 12, color: '#666' }}>
                                                    {flight.dest.iata_code}
                                                </div>
                                            </div>

                                            {/* 航班信息 */}
                                            <div style={{ marginLeft: 16, flex: 1 }}>
                                                <div style={{ fontSize: 14, fontWeight: 500 }}>
                                                    {flight.carrier} {flight.flight_number}
                                                </div>
                                                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                                                    {flight.aircraft}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 转机标识 */}
                                        {idx < flights.length - 1 && (
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                margin: '8px 0',
                                                color: '#666',
                                                fontWeight: 500
                                            }}>
                                                <div style={{
                                                    padding: '4px 16px',
                                                    backgroundColor: '#f0f0f0',
                                                    borderRadius: 20,
                                                    fontSize: 13
                                                }}>
                                                    转机 · {flight.dest.name}
                                                </div>
                                            </div>
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                        )
                    }

                    // 价格卡片组件
                    const PriceCard = ({ price, currency }) => (
                        <div style={{
                            backgroundColor: '#f0f9ff',
                            padding: '12px 16px',
                            borderRadius: 6,
                            textAlign: 'center',
                            border: '1px solid #e6f7ff'
                        }}>
                            <div style={{ fontSize: 16, fontWeight: 600 }}>
                                USD {price}
                            </div>
                        </div>
                    )

                    return (
                        <div style={{ maxWidth: 800, margin: '0 auto' }}>
                            {/* 去程航班 */}
                            <Card
                                title={`去程航班 · ${messages[currentConv][0].startpoint} → ${messages[currentConv][0].destination}`}
                                headStyle={{
                                    fontSize: 16,
                                    fontWeight: 600,
                                    backgroundColor: '#f0f7ff'
                                }}
                                style={{
                                    marginBottom: 24,
                                    marginTop: 24,
                                    borderRadius: 8,
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
                                }}
                            >
                                {flightArray.map((flightOption, index) => {
                                    // 提取航班段数据
                                    const segmentKeys = Object.keys(flightOption)
                                        .filter(key => !isNaN(key))
                                        .sort()
                                    const segments = segmentKeys.map(key => flightOption[key])

                                    return (
                                        <Card
                                            key={index}
                                            style={{
                                                marginBottom: 24,  // 增加航程之间的间距
                                                borderRadius: 8,
                                                border: '1px solid #f0f0f0'
                                            }}
                                            bodyStyle={{ padding: 0 }}
                                        >
                                            <Row align="middle">
                                                <Col span={18} style={{ padding: '16px' }}>
                                                    <FlightSegment segment={segments} />
                                                </Col>
                                                <Col span={6} style={{
                                                    borderLeft: '1px dashed #f0f0f0',
                                                    padding: '16px',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center'
                                                }}>
                                                    <PriceCard
                                                        price={flightOption.price}
                                                        currency={flightOption.currency}
                                                    />
                                                </Col>
                                            </Row>
                                        </Card>
                                    )
                                })}
                            </Card>

                            <Divider />

                            {/* 返程航班 */}
                            <Card
                                title={`返程航班 · ${messages[currentConv][0].destination} → ${messages[currentConv][0].startpoint}`}
                                headStyle={{
                                    fontSize: 16,
                                    fontWeight: 600,
                                    backgroundColor: '#f0f7ff'
                                }}
                                style={{
                                    borderRadius: 8,
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
                                }}
                            >
                                {returnArray.map((flightOption, index) => {
                                    // 提取航班段数据
                                    const segmentKeys = Object.keys(flightOption)
                                        .filter(key => !isNaN(key))
                                        .sort()
                                    const segments = segmentKeys.map(key => flightOption[key])

                                    return (
                                        <Card
                                            key={index}
                                            style={{
                                                marginBottom: 24,  // 增加航程之间的间距
                                                borderRadius: 8,
                                                border: '1px solid #f0f0f0'
                                            }}
                                            bodyStyle={{ padding: 0 }}
                                        >
                                            <Row align="middle">
                                                <Col span={18} style={{ padding: '16px' }}>
                                                    <FlightSegment segment={segments} />
                                                </Col>
                                                <Col span={6} style={{
                                                    borderLeft: '1px dashed #f0f0f0',
                                                    padding: '16px',
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    alignItems: 'center'
                                                }}>
                                                    <PriceCard
                                                        price={flightOption.price}
                                                        currency={flightOption.currency}
                                                    />
                                                </Col>
                                            </Row>
                                        </Card>
                                    )
                                })}
                            </Card>
                        </div>
                    )
                }

                const HotelCard = ({ hotel }) => {
                    const [isFlipped, setIsFlipped] = useState(false)

                    const handleClick = (e) => {
                        e.preventDefault()
                        setIsFlipped(!isFlipped)
                    }
                    const transportationInfo = hotel.nearby_places?.[0]?.transportations?.[0]
                        ? `${hotel.nearby_places[0].transportations[0].type}: ${hotel.nearby_places[0].transportations[0].duration}`
                        : null
                    // 内联样式定义
                    const styles = {
                        container: {
                            perspective: '1000px',
                            height: '320px',
                            marginTop: '24px',
                            justifyContent: 'space-between',
                        },
                        card: {
                            width: '100%',
                            height: '320px',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            overflow: 'hidden',
                            position: 'relative',
                            backgroundColor: '#fff'
                        },
                        imageContainer: {
                            height: '170px',
                            backgroundImage: `url(${hotel.main_image || 'https://via.placeholder.com/300x150'})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            position: 'relative'
                        },
                        ratingBadge: {
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            color: '#ffc107',
                            padding: '4px 8px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            fontSize: '14px'
                        },
                        cardContent: {
                            padding: '16px'
                        },
                        hotelName: {
                            fontSize: '18px',
                            marginTop: '0px',
                            fontWeight: '600',
                            marginBottom: '8px',
                            color: '#333'
                        },
                        location: {
                            display: 'flex',
                            alignItems: 'center',
                            color: '#666',
                            fontSize: '14px',
                            marginBottom: '8px'
                        },
                        transportation: {
                            display: 'flex',
                            alignItems: 'center',
                            color: '#888',
                            fontSize: '12px',
                            marginLeft: '20px' // 与位置图标对齐
                        },
                        price: {
                            fontSize: '16px',
                            fontWeight: 'bold',
                            color: '#1890ff',
                            marginBottom: '12px'
                        },
                        flipHint: {
                            position: 'absolute',
                            bottom: '10px',
                            right: '10px',
                            fontSize: '12px',
                            color: '#1890ff',
                            cursor: 'pointer'
                        },
                        amenitiesSection: {
                            marginBottom: '16px'
                        },
                        locationContainer: {
                            marginBottom: '8px',
                        },
                        amenitiesTags: {
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px',
                            marginTop: '8px'
                        },
                        tag: {
                            backgroundColor: '#f0f2f5',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px'
                        },
                        priceDetails: {
                            borderTop: '1px solid #f0f0f0',
                            paddingTop: '12px',
                            fontWeight: '500'
                        },
                        detailRow: {
                            display: 'flex',
                            padding: ' 2px 0',
                            justifyContent: 'space-between',
                            marginBottom: '8px',
                            fontSize: '14px',

                        },
                        totalPrice: {
                            fontWeight: 'bold',
                            color: '#1890ff',
                        }
                    }

                    return (
                        <Col span={24} style={{ marginBottom: '24px' }}>
                            <div style={styles.container}>
                                <ReactCardFlip
                                    isFlipped={isFlipped}
                                    flipDirection="horizontal"
                                    flipSpeedFrontToBack={0.6}
                                    flipSpeedBackToFront={0.6}
                                >
                                    {/* 卡片正面 */}
                                    <div key="front" style={styles.card} onClick={handleClick}>
                                        <div style={styles.imageContainer}>
                                            <div style={styles.ratingBadge}>
                                                <AiFillStar style={{ marginRight: '4px' }} />
                                                <span>{hotel.rating}</span>
                                            </div>
                                        </div>

                                        <div style={styles.cardContent}>
                                            <h3 style={styles.hotelName}>{hotel.name}</h3>
                                            <div style={styles.locationContainer}>
                                                <div style={styles.location}>
                                                    <MdPlace style={{ marginRight: '6px', color: '#1890ff' }} /> {/* 扁平风格图标 */}
                                                    Near {hotel.nearby_places?.[0]?.name || "City Center"}
                                                </div>

                                                {/* 显示交通信息 */}
                                                {transportationInfo && (
                                                    <div style={styles.transportation}>
                                                        {transportationInfo}
                                                    </div>
                                                )}
                                            </div>
                                            <div style={styles.price}>
                                                ${hotel.price_per_night?.extracted_price || '0'}/night
                                            </div>
                                        </div>

                                    </div>

                                    {/* 卡片背面 */}
                                    <div key="back" style={styles.card} onClick={handleClick}>
                                        <div style={{ ...styles.cardContent, height: '100%' }}>
                                            <h3 style={styles.hotelName}>{hotel.name}</h3>

                                            <div style={styles.amenitiesSection}>
                                                <h4>设施与服务</h4>
                                                <div style={styles.amenitiesTags}>
                                                    {hotel.amenities?.slice(0, 11).map((item, index) => (
                                                        <span key={index} style={styles.tag}>{item}</span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div style={styles.priceDetails}>
                                                <div style={styles.detailRow}>
                                                    <span>税前价格:</span>
                                                    <span>${hotel.price_per_night?.extracted_price_before_taxes || '0'}</span>
                                                </div>
                                                <div style={styles.detailRow}>
                                                    <span>税费:</span>
                                                    <span>${(
                                                        (hotel.price_per_night?.extracted_price || 0) -
                                                        (hotel.price_per_night?.extracted_price_before_taxes || 0)
                                                    ).toFixed(2)}</span>
                                                </div>
                                                <div style={styles.detailRow}>
                                                    <span>总价:</span>
                                                    <span style={styles.totalPrice}>
                                                        ${hotel.price_per_night?.extracted_price || '0'}
                                                    </span>
                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                </ReactCardFlip>
                            </div>
                        </Col>
                    )
                }

                const HotelCards = () => {
                    const data = tool_results[3]
                    console.log("酒店数据", data[0].hotel)
                    const dat = Object.values(data[0].hotel)
                    console.log("酒店数据列表", dat)
                    return (
                        < Row gutter={[16, 16]} >
                            {
                                dat.map((item, index) => (
                                    <HotelCard key={`hotel-${index}`} hotel={item} />
                                ))
                            }
                        </Row >
                    )
                }

                const AgentCards = () => {
                    const [visibleModal, setVisibleModal] = useState(null)

                    const AGENTS = [
                        {
                            nid: 0,
                            id: 'search',
                            name: '清小研',
                            icon: <SearchOutlined style={{ fontSize: 32 }} />,
                            content: '智能搜索分析系统，支持多维度数据检索...'
                        },
                        {
                            nid: 2,
                            id: 'flight',
                            name: '清小飞',
                            icon: <RocketOutlined style={{ fontSize: 32 }} />,
                            content: '航班动态追踪模块，实时更新全球航班信息...'
                        },
                        {
                            nid: 3,
                            id: 'hotel',
                            name: '清小居',
                            icon: <HomeOutlined style={{ fontSize: 32 }} />,
                            content: '酒店智能推荐引擎，基于用户偏好精准匹配...'
                        },
                        {
                            nid: 1,
                            id: 'map',
                            name: '清小计',
                            icon: <EnvironmentOutlined style={{ fontSize: 32 }} />,
                            content: '地理信息系统，支持多维路径规划...'
                        },
                    ]

                    return (
                        <Row gutter={[24, 24]} style={{ margin: '24px 0' }}>
                            {AGENTS.map(agent => (
                                <Col xs={24} sm={12} md={6} key={agent.id}>
                                    <Card
                                        hoverable
                                        onClick={() => setVisibleModal(agent.id)}
                                        style={{
                                            textAlign: 'center',
                                            borderRadius: 8,
                                            cursor: 'pointer',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <div style={{ marginBottom: 16 }}>{agent.icon}</div>
                                        <h3 style={{ margin: 0, color: '#2d3436', fontWeight: 500 }}>
                                            {agent.name}
                                        </h3>
                                    </Card>

                                    <Modal
                                        title={agent.name + " : " + agent.content}
                                        visible={visibleModal === agent.id}
                                        onCancel={() => setVisibleModal(null)}
                                        footer={null}
                                        width="100vw"
                                        style={{
                                            top: 0,
                                            maxWidth: '100vw',
                                            padding: 0
                                        }}
                                        bodyStyle={{
                                            height: 'calc(100vh - 55px)', // 扣除标题栏高度[6](@ref)
                                            overflowY: 'auto',
                                            padding: 24
                                        }}
                                    >
                                        <div style={{
                                            fontSize: 16,
                                            lineHeight: 1.8,
                                            margin: '0 auto'
                                        }}>
                                            <div className="markdown-container" >
                                                <ReactMarkdown
                                                    remarkPlugins={[remarkGfm]}
                                                    components={components}
                                                    rehypePlugins={[]}
                                                    skipHtml={true}
                                                >
                                                    {cleanContent({ text: agent_results[agent.nid].llm_output })}
                                                </ReactMarkdown>
                                            </div>
                                            {/* 可扩展添加具体功能模块 */}
                                        </div>
                                    </Modal>
                                </Col>
                            ))}
                            <Card
                                title="清小结 · 综合分析报告"
                                headStyle={{
                                    fontSize: 18,
                                    fontWeight: 600,
                                    backgroundColor: '#f0f7ff'
                                }}
                                style={{
                                    borderRadius: 8,
                                    boxShadow: '0 2px 12px rgba(0,0,0,0.08)'
                                }}
                            >
                                <div style={{
                                    fontSize: 16,
                                    lineHeight: 1.8,
                                    padding: 16
                                }}>
                                    <div className="markdown-container">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            components={components}
                                            rehypePlugins={[]}
                                            skipHtml={true}
                                        >
                                            {cleanContent({ text: agent_results[4].llm_output })}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            </Card>
                        </Row>
                    )
                }
                return (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-start', // 实现flex-start对齐
                        maxWidth: '80%',
                        marginTop: '15px',
                        backgroundColor: '#fff',
                        borderRadius: 12,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                        padding: 24
                    }}>
                        {/* 基础信息展示（网页1卡片布局优化） */}
                        <div style={{ width: '100%' }}>
                            {renderToolResults()}
                            <FlightCard flightData={tool_results[2]} />
                            <HotelCards />
                            <AgentCards />
                        </div>
                    </div>
                )

            }
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
                        <Dropdown
                            overlay={
                                <Menu
                                    style={{ justifyContent: 'space-between' }}
                                    items={[
                                        {
                                            key: 'normal',
                                            label: '普通搜索',
                                            onClick: () => handleCreateConv('normal'),
                                            style: { justifyContent: 'space-between' },
                                        },
                                        {
                                            key: 'deep',
                                            label: '深度搜索',
                                            onClick: () => handleCreateConv('deep')
                                        }
                                    ]}
                                    className="custom-dropdown-menu"
                                />
                            }
                            trigger={['click']}
                        >
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                block
                                ref={buttonRef}
                            >
                                {!collapsed && "新建会话"}
                            </Button>
                        </Dropdown>
                    </div>
                </Affix>
                {/* 会话列表 */}
                <Menu
                    mode="inline"
                    selectedKeys={[String(currentConv)]}
                    onSelect={({ key }) => {
                        if (key !== currentConv) {
                            setLocation([])
                        }
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
                                        {messages && messages[convId] && (!messages[convId][0]?.isDeep ? getLastUserMessage(convId) : '深度搜索：' + messages[convId][0].destination)}
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
                                    text={msg?.text || ''}
                                    destination={msg?.destination || ''}
                                    startpoint={msg?.startpoint || ''}
                                    date={msg?.date || ''}
                                    preference={msg?.preference || ''}
                                    tool_results={msg?.tool_results || []}
                                    agent_results={msg?.agent_results || []}
                                    isUser={msg.isUser}
                                    isLoading={msg.isLoading}
                                    isDeep={msg.isDeep}  // 添加isDeep属性
                                />
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* 输入区域 */}
                        {/* 输入区域 */}
                        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                                {isDeepSearch[currentConv] ? (
                                    // 深度搜索状态
                                    <div style={{
                                        background: '#1890ff',
                                        borderRadius: 8,
                                        padding: '8px 12px',
                                        color: 'white',
                                        alignContent: 'center',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gridTemplateColumns: '1fr auto',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                    }}>
                                        <div>深度搜索</div>
                                        <div style={{ fontSize: 12, opacity: 0.8 }}>已启用联网增强模式</div>
                                    </div>
                                ) : (
                                    // 普通搜索状态
                                    <div style={{
                                        background: '#f5f5f5',
                                        borderRadius: 8,
                                        padding: '8px 12px',
                                        color: 'rgba(0,0,0,0.65)',
                                        border: '1px solid #d9d9d9',
                                    }}>
                                        普通搜索
                                    </div>
                                )}
                            </div>

                            {isDeepSearch[currentConv] ? (
                                <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                                    <Input
                                        placeholder="出发地"
                                        value={deepSearchInputs.startpoint}
                                        onChange={e => setDeepSearchInputs(v => ({ ...v, startpoint: e.target.value }))}
                                    />
                                    <Input
                                        placeholder="目的地"
                                        value={deepSearchInputs.destination}
                                        onChange={e => setDeepSearchInputs(v => ({ ...v, destination: e.target.value }))}
                                    />
                                    <DateRangePicker
                                        value={deepSearchInputs.date}
                                        onChange={date => setDeepSearchInputs(p => ({ ...p, date }))}
                                    />
                                    <Input
                                        placeholder="偏好（如美食/景点）"
                                        value={deepSearchInputs.preference}
                                        onChange={e => setDeepSearchInputs(v => ({ ...v, preference: e.target.value }))}
                                    />
                                </div>
                            ) : (
                                <Input.Search
                                    style={{ flex: 1 }}
                                    placeholder="输入消息..."
                                    enterButton="发送"
                                    size="large"
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    onSearch={handleSend}
                                />
                            )}

                            {isDeepSearch[currentConv] ? (
                                <Button
                                    type="primary"
                                    size="large"
                                    onClick={() => handleSend()}
                                >
                                    发送
                                </Button>
                            ) : <div></div>}
                        </div>
                    </div>

                    {/* 地图面板 */}
                    <div style={{ flex: 1, borderRadius: 8 }}>
                        <APIProvider apiKey={'AIzaSyD8kz0EW1KKo8B3I8GU7nAy19R8S6X6RVE'}>
                            <Map
                                mapId={'tsinghua-map'}
                                defaultZoom={10}
                                gestureHandling="greedy"
                                zIndex={0}
                                defaultCenter={{ lat: 39.9042, lng: 116.4074 }} // 北京
                                style={{ height: '100%', width: '100%' }}>
                                <PoiMarkers pois={locations} />
                                <MapComponent locations={locations} />
                            </Map>
                        </APIProvider>
                    </div>
                    {isLoadingState && (
                        <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            zIndex: 1000,
                            backgroundColor: 'rgba(255, 255, 255, 0.8)',
                            padding: '16px 24px',
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: '#333',
                            transition: 'all 0.3s ease-in-out',
                        }}>
                            <div style={{ marginRight: '12px' }}>
                                {/* 加载动画图标 */}
                                <svg width="24" height="24" viewBox="0 0 38 38" stroke="#333">
                                    <g fill="none" fillRule="evenodd">
                                        <g transform="translate(1 1)" strokeWidth="2">
                                            <circle strokeOpacity=".5" cx="18" cy="18" r="18" />
                                            <path d="M36 18c0-9.94-8.06-18-18-18">
                                                <animateTransform
                                                    attributeName="transform"
                                                    type="rotate"
                                                    from="0 18 18"
                                                    to="360 18 18"
                                                    dur="1s"
                                                    repeatCount="indefinite" />
                                            </path>
                                        </g>
                                    </g>
                                </svg>
                            </div>
                            正在加载地图...
                        </div>
                    )}
                </Content>
            </Layout>
        </Layout >
    )
}

export default MainPage