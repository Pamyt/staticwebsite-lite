import { Link, Outlet } from 'react-router-dom'
import { Box, Stack, Button, IconButton, Collapse } from '@mui/material'
import { message } from 'antd'
import { PushPin, PushPinOutlined } from '@mui/icons-material'
import { useState, useRef, useEffect } from 'react'
import { DraggableCore } from 'react-draggable'

function MainLayout () {
    const [expanded, setExpanded] = useState(false)
    const [hovering, setHovering] = useState(false)
    const [rotation, setRotation] = useState(45) // 未展开时的倾斜角度
    const nodeRef = useRef(null)


    // 动态旋转处理
    useEffect(() => {
        setRotation(hovering || expanded ? 0 : 45)
    }, [hovering, expanded])
    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            {/* 左下角图钉导航栏 */}
            <Box
                ref={nodeRef}
                sx={{
                    position: 'fixed',
                    left: (expanded || hovering) ? 20 : 7,
                    bottom: 20,
                    width: (expanded || hovering) ? '8vw' : '3vw',
                    zIndex: 1000,
                    bgcolor: 'rgba(245,245,245,0.9)',
                    borderRadius: (expanded || hovering) ? 2 : '50%',
                    boxShadow: 4,
                    transition: 'all 0.3s ease',
                }}
                onMouseEnter={() => !expanded && setHovering(true)}
                onMouseLeave={() => !expanded && setHovering(false)}
            >
                <IconButton
                    onClick={() => setExpanded(!expanded)}
                    sx={{
                        outline: 'none',
                        display: 'block', mx: 'auto', transition: 'transform 0.3s',
                        transform: `rotate(${rotation}deg)`, // 容器倾斜效果
                        borderRadius: (expanded || hovering) ? 2 : '50%',
                        '&:hover, &:active, &:focus': {
                            outline: 'none',
                            border: 'none',
                            boxShadow: 'none',
                            backgroundColor: 'transparent'
                        }

                    }}
                >
                    {expanded ? <PushPin /> : <PushPinOutlined />}
                </IconButton>

                <Collapse in={expanded || hovering}>
                    <Stack spacing={1} sx={{ p: 1 }}>
                        <Button
                            component={Link}
                            to="/mainpage"
                            variant="contained"
                            size="small"
                            fullWidth
                        >
                            主页面
                        </Button>
                        <Button
                            component={Link}
                            to="/postpage"
                            variant="contained"
                            color="secondary"
                            size="small"
                            fullWidth
                        >
                            笔记发布
                        </Button>
                        <Button
                            component={Link}
                            to="/login"
                            size="small"
                            fullWidth
                            onClick={() => {
                                sessionStorage.removeItem('userid')
                                sessionStorage.removeItem('username')
                                message.success('登出成功！')
                            }}
                        >
                            登出
                        </Button>
                    </Stack>
                </Collapse>
            </Box>

            {/* 右侧内容区 */}
            <Box sx={{ flex: 1, overflow: 'auto' }}>
                <Outlet />
            </Box>
        </Box >
    )
}

export default MainLayout