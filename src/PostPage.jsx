/* eslint-disable no-unused-vars */
import React, { useState, useEffect, use } from 'react'
import {
    Row,
    Col,
    Button,
    Card,
    List,
    Modal,
    Form,
    Input,
    Select,
    Tag,
    Typography,
    Popconfirm,
    message
} from 'antd'
import {
    EditOutlined,
    HeartFilled,
    HeartOutlined
} from '@ant-design/icons'
import { getallpost, makepost, likepost, dislikepost } from './api.js'

const { Title } = Typography
const { Option } = Select

// 模拟初始数据

const PostPage = () => {
    const [form] = Form.useForm()
    const [posts, setPosts] = useState([])
    const [postModalVisible, setPostModalVisible] = useState(false)
    const [detailModalVisible, setDetailModalVisible] = useState(false)
    const [selectedPost, setSelectedPost] = useState(null)
    const [sortBy, setSortBy] = useState('time')
    const currentUser = sessionStorage.getItem('userid')
    const currentName = sessionStorage.getItem('username')
    useEffect(() => {
        const initializePosts = async () => {
            const response = await getallpost()
            if (response.status === 200) {
                const data = response.data.posts.map(post => ({
                    ...post,
                    likes: post.like_list.length
                }))
                setPosts(data)
                console.log('获取笔记成功:', data)
            } else {
                message.error('获取笔记失败，请稍后再试')
            }
        }
        initializePosts()
    }, [])
    // 点赞功能组件
    const LikeButton = ({ post }) => {
        console.log('当前用户:', currentName)
        console.log('点赞列表:', post.like_list)
        const [liked, setLiked] = useState(post.like_list.includes(currentName))
        const [likeCount, setLikeCount] = useState(post.likes)

        const handleLike = (e) => {
            e.stopPropagation()
            e.nativeEvent.stopImmediatePropagation()
            const newCount = liked ? likeCount - 1 : likeCount + 1
            const newLikeList = post.like_list.includes(currentName)
                ? post.like_list.filter(u => u !== currentName)
                : [...post.like_list, currentName]
            setLikeCount(newCount)
            setLiked(!liked)
            if (liked) {
                dislikepost(currentUser, post.post_id,)
                setPosts(posts.map(p => p.post_id === post.post_id ? { ...p, likes: newCount, like_list: newLikeList } : p))
                if (selectedPost && selectedPost.post_id === post.post_id) {
                    setSelectedPost({ ...selectedPost, likes: newCount, like_list: newLikeList })
                }
            }
            else {
                likepost(currentUser, post.post_id,)
                setPosts(posts.map(p => p.post_id === post.post_id ? { ...p, likes: newCount, like_list: newLikeList } : p))
                if (selectedPost && selectedPost.post_id === post.post_id) {
                    setSelectedPost({ ...selectedPost, likes: newCount, like_list: newLikeList })
                }
            }
            // 这里应调用API更新点赞状态
            console.log('更新点赞状态:', post.post_id, newCount)
        }

        return (
            <div onClick={handleLike} style={{ cursor: 'pointer' }}>
                {liked ? (
                    <HeartFilled style={{ color: '#ff4d4f', fontSize: 18 }} />
                ) : (
                    <HeartOutlined style={{ fontSize: 18 }} />
                )}
                <span style={{ marginLeft: 8 }}>{likeCount}</span>
            </div>
        )
    }
    const getTimestamp = (item) =>
        typeof item.time_stamp === 'number'
            ? item.time_stamp
            : new Date(item.time_stamp).getTime()
    // 提交新笔记
    const handleSubmit = (values) => {
        const newPost = {
            post_id: posts.length + 1,
            post_title: values.title,
            post_content: values.content,
            travel_place: values.location,
            post_owner_name: currentName,
            likes: 0,
            like_list: [],
            timestamp: Date.now()
        }
        makepost(currentUser, values.title, values.content, values.location)
        setPosts([newPost, ...posts])
        message.success('笔记发布成功！')
        setPostModalVisible(false)
        form.resetFields()
    }

    // 布局结构
    return (
        <div style={{ padding: 24, width: "96vw", backgroundColor: '#fff' }}>
            {/* 头部导航 */}
            <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
                <Col>
                    <Title level={3} style={{ margin: 0 }}>所有笔记</Title>
                </Col>
                <Col>
                    <Row gutter={16}>
                        <Col>
                            <Select
                                defaultValue="time"
                                onChange={setSortBy}
                                style={{ width: 120 }}
                            >
                                <Option value="time">最新优先</Option>
                                <Option value="likes">热门优先</Option>
                            </Select>
                        </Col>
                        <Col>
                            <Button
                                type="primary"
                                icon={<EditOutlined />}
                                onClick={() => setPostModalVisible(true)}
                                style={{ borderRadius: 20 }}
                            >
                                写笔记
                            </Button>
                        </Col>
                    </Row>
                </Col>
            </Row>

            {/* 笔记列表 */}
            <List
                grid={{
                    gutter: 24,
                    xs: 1,
                    sm: 2,
                    md: 3,
                    lg: 3,
                    xl: 4
                }}
                dataSource={[...posts].sort((a, b) =>
                    sortBy === 'likes' ? b.likes - a.likes : getTimestamp(b) - getTimestamp(a)
                )}
                renderItem={post => (
                    <List.Item>
                        <Card
                            hoverable
                            title={post.post_title}
                            extra={<Tag color="blue">{post.travel_place}</Tag>}
                            actions={[
                                <LikeButton post={post} />,
                                <span>作者：{post.post_owner_name}</span>
                            ]}
                            onClick={() => {
                                setSelectedPost(post)
                                setDetailModalVisible(true)
                            }}
                        >
                            < div style={{ color: 'rgba(0,0,0,0.6)' }}>
                                {post.post_content.slice(0, 80)}...
                            </div>
                        </Card>

                    </List.Item>
                )}
            />

            {/* 发布弹窗 */}
            <Modal
                title="撰写新笔记"
                visible={postModalVisible}
                onCancel={() => setPostModalVisible(false)}
                footer={
                    <div style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 8  // 按钮间距
                    }}>
                        <Popconfirm
                            title="确认清除草稿？"
                            onConfirm={() => form.resetFields()}
                            placement="topLeft"
                        >
                            <Button danger>清除草稿</Button>
                        </Popconfirm>
                        <Button onClick={() => {
                            const values = form.getFieldsValue()
                            localStorage.setItem('draft', JSON.stringify(values))
                            message.info('草稿已暂存')
                        }}
                            style={{ color: '#666' }
                            }
                        >
                            暂存草稿
                        </Button>
                        <Button
                            type="primary"
                            onClick={() => form.submit()}
                            style={{ minWidth: 100 }}
                        >
                            立即发布
                        </Button>
                    </div>
                }
            >
                <Form form={form} onFinish={handleSubmit} layout="vertical">
                    <Form.Item
                        name="title"
                        label="笔记标题"
                        rules={[{ required: true, message: '请输入标题' }]}
                    >
                        <Input placeholder="例：难忘的京都之旅" />
                    </Form.Item>
                    <Form.Item
                        name="location"
                        label="旅行地点"
                        rules={[{ required: true, message: '请输入地点' }]}
                    >
                        <Input placeholder="例：日本京都" />
                    </Form.Item>
                    <Form.Item
                        name="content"
                        label="游记内容"
                        rules={[{ required: true, message: '请分享你的旅行故事' }]}
                    >
                        <Input.TextArea rows={6} />
                    </Form.Item>
                </Form>
            </Modal >

            {/* 详情弹窗 */}
            < Modal
                title={selectedPost?.post_title}
                visible={detailModalVisible}
                footer={null}
                onCancel={() => setDetailModalVisible(false)}
                width={800}
                className="custom-modal"
                bodyStyle={{ padding: 0 }}
            >
                {selectedPost && (
                    <Card
                        bordered={false}
                        cover={
                            <img
                                alt="travel-photo"
                                src={selectedPost.coverImage || "https://img1.baidu.com/it/u=3031575495,2960930975&fm=253&fmt=auto&app=138&f=JPEG?w=750&h=500"}
                                style={{ maxHeight: 300, objectFit: 'cover' }}
                            />
                        }
                        actions={[
                            <LikeButton post={selectedPost} key="like" />,
                            <span key="time">
                                {new Date(selectedPost.time_stamp).toLocaleString()}
                            </span>
                        ]}
                    >
                        <Card.Meta
                            title={
                                <Tag color="geekblue" style={{ fontSize: 14 }}>
                                    {selectedPost.travel_place}
                                </Tag>
                            }
                            description={
                                <Typography.Paragraph
                                    ellipsis={{ rows: 6, expandable: true }}
                                    style={{ lineHeight: 1.8, color: 'rgba(0,0,0,0.8)' }}
                                >
                                    {selectedPost.post_content}
                                </Typography.Paragraph>
                            }
                        />
                    </Card>
                )}
            </Modal >
        </div >
    )
}

export default PostPage