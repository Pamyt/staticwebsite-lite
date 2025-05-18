import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
    Box, Stack, Button, IconButton, Collapse,
    useMediaQuery, ThemeProvider, createTheme
} from '@mui/material'
import { message } from 'antd'
import {
    PushPin, PushPinOutlined,
    Share as ShareIcon,
    TravelExplore as TravelExploreIcon,
    AccountCircle, ExitToApp
} from '@mui/icons-material'
import { useState, useRef, useEffect } from 'react'
import './MainLayout.css'

function MainLayout () {
    const [expanded, setExpanded] = useState(false)
    const [hovering, setHovering] = useState(false)
    const [userHover, setUserHover] = useState(false)
    const [rotation, setRotation] = useState(45)
    const nodeRef = useRef(null)
    const navigate = useNavigate()
    const location = useLocation()
    const isMobile = useMediaQuery('(max-width:600px)')
    useEffect(() => {
        console.log("location.pathname", location.pathname)
    }, [])
    // 动态旋转处理
    useEffect(() => {
        setRotation(hovering || expanded ? 0 : 45)
    }, [hovering, expanded])

    // 登出处理
    const handleLogout = () => {
        sessionStorage.removeItem('userid')
        sessionStorage.removeItem('username')
        message.success('登出成功！')
        navigate('/login')
    }

    // 响应式主题配置
    const theme = createTheme({
        components: {
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                    }
                }
            }
        }
    })

    return (
        <ThemeProvider theme={theme}>
            <Box sx={{ display: 'flex', height: '100vh' }}>
                {/* 用户操作面板 */}
                <Box
                    sx={{
                        position: 'fixed',
                        left: isMobile ? 10 : 12,
                        bottom: isMobile ? 60 : 5,
                        zIndex: 2000,
                        opacity: 0.3,
                        transition: 'opacity 0.3s',
                        '&:hover': { opacity: 1 }
                    }}
                    onMouseEnter={() => setUserHover(true)}
                    onMouseLeave={() => setUserHover(false)}
                >
                    <IconButton sx={{ p: 0 }}>
                        <AccountCircle sx={{
                            fontSize: 32,
                            filter: 'drop-shadow(2px 2px 3px rgba(0,0,0,0.2))'
                        }} />
                    </IconButton>

                    <Collapse in={userHover} sx={{
                        transformOrigin: 'left bottom',
                        mt: 1
                    }}>
                        <Box sx={{
                            bgcolor: 'rgba(255,255,255,0.95)',
                            borderRadius: 2,
                            p: 1,
                            boxShadow: 3
                        }}>
                            <Button
                                variant="text"
                                onClick={handleLogout}
                                fullWidth
                                startIcon={<ExitToApp />}
                                sx={{
                                    color: 'error.main',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255,0,0,0.1)'
                                    }
                                }}
                            >
                                安全登出
                            </Button>
                        </Box>
                    </Collapse>
                </Box>

                {/* 左下角导航栏（保持原逻辑不变） */}
                {/* ...原导航栏代码... */}

                {/* 内容区与动态底部提示 */}
                <Box sx={{
                    flex: 1,
                    overflow: 'auto',
                    position: 'relative',
                    padding: '0px'
                }}>
                    <Outlet />

                    {/* 条件渲染底部提示 */}
                    {location.pathname === '/mainpage' && (
                        <Box sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            py: 3,
                            height: '2vh',
                            bgcolor: 'background.paper',
                            borderColor: 'divider'
                        }}>
                            <Button
                                component={Link}
                                to="/postpage"
                                startIcon={<ShareIcon />}
                                fullWidth
                                sx={{
                                    color: 'primary.main',
                                    fontSize: isMobile ? '0.875rem' : '1rem',
                                    '&:hover': {
                                        transform: 'scale(1.02)'
                                    }
                                }}
                            >
                                想借鉴他人的旅游经验/分享自己的旅行笔记？点击这里进行笔记发布！
                            </Button>
                        </Box>
                    )}

                    {location.pathname === '/postpage' && (
                        <Box sx={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            py: 3,
                            height: '2vh',
                            bgcolor: 'rgba(255,255,255,0.95)',
                            backdropFilter: 'blur(8px)',
                            zIndex: 1000
                        }}>
                            <Button
                                component={Link}
                                to="/mainpage"
                                startIcon={<TravelExploreIcon />}
                                fullWidth
                                sx={{
                                    color: 'primary.main',
                                    fontSize: isMobile ? '0.875rem' : '1rem',
                                    '&:hover': {
                                        transform: 'scale(1.02)'
                                    }
                                }}
                            >
                                想让智能旅游助手帮你做旅行规划？点击这里开始对话！
                            </Button>
                        </Box>
                    )}
                </Box>
            </Box>
        </ThemeProvider>
    )
}

export default MainLayout