import { useEffect, useState, useMemo, useRef } from "react";
import Layout from "../../Partials/LayoutHomeThree";
import { FaGavel } from "react-icons/fa";
import { toast } from "react-toastify";
import { decodeToken } from "../../Helpers/jwtDecode";
import { Star, StarHalf, Star as StarOutline } from "lucide-react";
import axios from "axios";
import Constants from "../../../../Constants";
import { io } from 'socket.io-client';
import { useNavigate } from "react-router-dom";

export default function AuctionRoom() {

    const modalRef = useRef(null);

    const navigate = useNavigate();
    const [exitLocked, setExitLocked] = useState(false);
    const guardedNavigate = (to) => {
        if (exitLocked && countdown.ms > 0) {
            toast.warning("Bạn đã đặt giá, không thể rời phòng cho đến khi phiên kết thúc.");
            return;
        }
        navigate(to);
    };
    const socketRef = useRef(null);
    const currentAuctionIdRef = useRef(null);

    const [activeAuction, setActiveAuction] = useState(null);
    const [loadingAuction, setLoadingAuction] = useState(true);

    const [bids, setBids] = useState([]);
    const [currentPrice, setCurrentPrice] = useState(0);
    const [user] = useState(decodeToken(localStorage.getItem("token")));

    const [bidStep, setBidStep] = useState(5_000_000);
    const [stepCount, setStepCount] = useState(2);

    const [selectedImage, setSelectedImage] = useState("");
    const [images, setImages] = useState([]);

    const [showFullShortDesc, setShowFullShortDesc] = useState(false);
    const [showFullName, setShowFullName] = useState(false);

    const incrementAmount = bidStep * stepCount;
    const newBidPrice = currentPrice + incrementAmount;

    const [showAllAttributes, setShowAllAttributes] = useState(false);

    const minAllowed = useMemo(() => {
        const step = Number(activeAuction?.priceStep || bidStep || 0);
        const base = Number(currentPrice || 0);
        return step > 0 ? base + step : base + 1;
    }, [activeAuction?.priceStep, bidStep, currentPrice]);

    const [highestBidUserId, setHighestBidUserId] = useState(null);

    const meId = Number(user?.id || user?.user_id);
    const isMyHighest = meId && highestBidUserId && meId === Number(highestBidUserId);

    const formatVnd = (n) => (Number(n) || 0).toLocaleString("vi-VN") + " ₫";

    const [showWinModal, setShowWinModal] = useState(false);
    const [winInfo, setWinInfo] = useState(null);
    const handledWinRef = useRef(false);

    const [cooldownUntil, setCooldownUntil] = useState(null);
    const [cooldownLeft, setCooldownLeft] = useState(0);

    const [showFullDescription, setShowFullDescription] = useState(false);

    const audioRef = useRef(null);
    const hasBeepedRef = useRef(false);

    const [overridePrice, setOverridePrice] = useState(newBidPrice);

    const bidValue = overridePrice ?? newBidPrice;

    const [countdown, setCountdown] = useState({
        label: "",
        text: "",
        ms: 0,
    });

    const bidInFlightRef = useRef(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setOverridePrice(newBidPrice);
    }, [newBidPrice]);

    useEffect(() => {
        audioRef.current = new Audio("/sounds/beep.mp3");
    }, []);

    useEffect(() => {
        if (countdown.ms <= 10_000 && countdown.ms > 0 && !hasBeepedRef.current) {
            audioRef.current
                .play()
                .catch(() => {
                });
            hasBeepedRef.current = true;
        }
        if (countdown.ms > 10_000) {
            hasBeepedRef.current = false;
        }
    }, [countdown.ms]);

    const pad2 = (n) => String(n).padStart(2, "0");
    const formatDuration = (ms) => {
        const total = Math.max(0, Math.floor(ms / 1000));
        const days = Math.floor(total / 86400);
        const hours = Math.floor((total % 86400) / 3600);
        const minutes = Math.floor((total % 3600) / 60);
        const seconds = total % 60;
        return days > 0
            ? `${days}d ${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`
            : `${pad2(hours)}:${pad2(minutes)}:${pad2(seconds)}`;
    };

    const parseDbLocal = (iso) => {
        if (!iso) return null;
        const s = String(iso).replace('Z', '').replace(/\.\d+$/, '');
        const [datePart, timePart = '00:00:00'] = s.split('T');
        if (!datePart) return null;
        const [y, m, d] = datePart.split('-').map(Number);
        const [hh = 0, mm = 0, ss = 0] = timePart.split(':').map(Number);

        return new Date(y, m - 1, d, hh, mm, ss);
    };

    useEffect(() => {
        const s = io(Constants.DOMAIN_API, {
            transports: ["websocket"],
            auth: { token: localStorage.getItem("token") },
        });
        socketRef.current = s;

        // const onWinner = (payload) => {
        //     if (String(payload.auctionId) === String(currentAuctionIdRef.current)) {
        //         toast.success(
        //             `Chúc mừng ${payload.winner.userName} đã chiến thắng phiên đấu giá ${payload.winner.productName} với giá ${formatVnd(payload.winner.amount)}!`,
        //             {
        //                 position: "top-center",
        //                 autoClose: 10000,
        //                 hideProgressBar: false,
        //                 closeOnClick: true,
        //                 pauseOnHover: true,
        //                 draggable: true,
        //                 progress: undefined,
        //                 theme: "light",
        //             }
        //         );
        //     } else {
        //         toast.info(
        //             `Người dùng ${payload.winner.userName} vừa chiến thắng phiên đấu giá ${payload.winner.productName}!`,
        //             {
        //                 position: "top-center",
        //                 autoClose: 8000,
        //                 hideProgressBar: false,
        //                 closeOnClick: true,
        //                 pauseOnHover: true,
        //                 draggable: true,
        //                 progress: undefined,
        //                 theme: "light",
        //             }
        //         );
        //     }
        // };

        const onStatus = (payload) => {
            const isCurrent = String(payload.auctionId) === String(currentAuctionIdRef.current);

            if (payload.status === "active") {
                if (isCurrent) {
                    if (payload.currentPrice != null) {
                        setCurrentPrice(Number(payload.currentPrice));
                    }
                    setActiveAuction(prev => prev ? { ...prev, status: "active" } : prev);

                    //   toast.success("Phiên đấu giá đã bắt đầu!", { position: "top-center", autoClose: 5000 });
                } else {

                    fetchActiveAuction();
                    toast.success("Có phiên mới vừa bắt đầu!", { position: "top-right", autoClose: 5000 });
                }
                handledWinRef.current = false;
                return;
            }

            if (payload.status === "ended") {
                if (isCurrent) {

                    if (payload.winner && Number(payload.winner.user_id) === meId) {
                        toast.success(
                            `Chúc mừng bạn đã chiến thắng với giá ${formatVnd(payload.winner.bidAmount)}!`,
                            { position: "top-right", autoClose: 10000 }
                        );

                        setWinInfo({
                            amount: Number(payload.winner.bidAmount),
                            auctionId: payload.auctionId,
                        });
                        setShowWinModal(true);

                    } else if (payload.winner) {

                        toast.info(
                            `Người dùng ${payload.winner.user_name} đã chiến thắng với giá ${formatVnd(payload.winner.bidAmount)}.`,
                            { position: "top-right", autoClose: 10000 }
                        );
                    } else {
                        toast.error("Phiên đấu giá đã kết thúc!", { position: "top-right" });
                    }

                    setExitLocked(false);
                    setBids([]);
                    setHighestBidUserId(null);
                    setCurrentPrice(0);
                    handledWinRef.current = false;
                    currentAuctionIdRef.current = null;
                    setActiveAuction(null);
                } else {

                }

                fetchActiveAuction();
                return;
            }

            if (isCurrent) {

                if (payload.currentPrice != null) {
                    setCurrentPrice(Number(payload.currentPrice));
                }
                setActiveAuction(prev => prev ? { ...prev, status: payload.status } : prev);
            }
        };

        const onBidNew = (payload) => {
            if (String(payload.auctionId) !== String(currentAuctionIdRef.current)) return;

            setCurrentPrice(Number(payload.currentPrice) || 0);
            setHighestBidUserId(Number(payload.highestBidUserId) || null);
            setBids((prev) => [
                {
                    user: payload.bid.user_name,
                    amount: Number(payload.bid.bidAmount),
                    time: new Date(payload.bid.bidTime).toLocaleTimeString("vi-VN"),
                },
                ...prev,
            ]);
            // setCooldownUntil(new Date(Date.now() + 10_000));
        };

        s.on("auction:status", onStatus);
        s.on("bid:new", onBidNew);

        return () => {
            s.off("auction:status", onStatus);
            s.off("bid:new", onBidNew);
            s.disconnect();
        };
    }, []);

    useEffect(() => {
        currentAuctionIdRef.current = activeAuction?.id ?? null;
        if (socketRef.current && activeAuction?.id) {
            socketRef.current.emit("auction:join", { auctionId: activeAuction.id });
        }
    }, [activeAuction?.id]);

    useEffect(() => {
        if (!activeAuction?.start_time || !activeAuction?.end_time) {
            setCountdown({ label: "", text: "", ms: 0 });
            return;
        }

        const startAt = parseDbLocal(activeAuction.start_time);
        const endAt = parseDbLocal(activeAuction.end_time);

        // const tick = () => {
        //     const now = new Date();
        //     if (now < startAt) {
        //         const ms = startAt - now;
        //         setCountdown({ label: "Bắt đầu sau", text: formatDuration(ms), ms });
        //         return;
        //     }
        //     if (now >= startAt && now < endAt) {
        //         const ms = endAt - now;
        //         setCountdown({ label: "Kết thúc sau", text: formatDuration(ms), ms });
        //         return;
        //     }
        //     setCountdown({ label: "Đã kết thúc", text: "00:00:00", ms: 0 });
        // };

        const tick = () => {
            const now = new Date();
            if (now < startAt) {
                const ms = startAt - now;
                setCountdown({ label: "Bắt đầu sau", text: formatDuration(ms), ms });
                return;
            }
            if (now >= startAt && now < endAt) {
                const ms = endAt - now;
                setCountdown({ label: "Kết thúc sau", text: formatDuration(ms), ms });
                return;
            }

            setCountdown({ label: "Đã kết thúc", text: "", ms: 0 });

            clearInterval(itv);
        };

        tick();
        const itv = setInterval(tick, 1000);
        return () => clearInterval(itv);
    }, [activeAuction?.start_time, activeAuction?.end_time]);

    const numberToVietnamese = (input) => {
        let n = Math.round(Number(input) || 0);
        if (n === 0) return "Không";

        const d = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];
        const units = ["", " nghìn", " triệu", " tỷ", " nghìn tỷ", " triệu tỷ"];

        const readTens = (num) => {
            const ch = Math.floor(num / 10);
            const dv = num % 10;
            if (ch === 0) return dv ? d[dv] : "";
            if (ch === 1) {
                if (dv === 0) return "mười";
                if (dv === 5) return "mười lăm";
                return "mười " + (dv === 1 ? "một" : d[dv]);
            }
            let res = d[ch] + " mươi";
            if (dv === 0) return res;
            if (dv === 1) return res + " mốt";
            if (dv === 5) return res + " lăm";
            return res + " " + d[dv];
        };

        const readHundreds = (num, full, isHighestBlock) => {
            const tr = Math.floor(num / 100);
            const du = num % 100;

            if (isHighestBlock && tr === 0) {
                if (du === 0) return "";
                if (du < 10) return d[du];
                return readTens(du);
            }

            let res = "";
            if (full || tr > 0) {
                res += d[tr] + " trăm";
                if (du > 0 && du < 10) res += " lẻ " + d[du];
                else if (du >= 10) res += " " + readTens(du);
            } else {
                if (du > 0 && du < 10) res += d[du];
                else if (du >= 10) res += readTens(du);
            }
            return res.trim();
        };

        let parts = [];
        let i = 0;
        while (n > 0 && i < units.length) {
            const block = n % 1000;
            if (block > 0) {
                const full = parts.length > 0;
                const isHighestBlock = Math.floor(n / 1000) === 0;
                const text = readHundreds(block, full, isHighestBlock);
                if (text) parts.unshift(text + units[i]);
            }
            n = Math.floor(n / 1000);
            i++;
        }

        const result = parts.join(" ").replace(/\s+/g, " ").trim();
        return result.charAt(0).toUpperCase() + result.slice(1);
    };

    const amountInWords = useMemo(() => {
        return numberToVietnamese(bidValue) + " đồng";
    }, [bidValue]);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchActiveAuction();
    }, []);

    const fetchActiveAuction = async () => {
        try {
            setLoadingAuction(true);

            const res = await axios.get(`${Constants.DOMAIN_API}/admin/auctions`, {
                params: { status: "active", limit: 1 },
            });

            const auction = res.data?.data?.[0];

            if (!auction) {
                setActiveAuction(null);
                // toast.info("Hiện không có phiên đấu giá nào đang diễn ra.");
                return;
            }

            setActiveAuction(auction);

            const initialPrice = Number(
                auction?.current_price ??
                auction?.start_price ??
                auction?.variant?.price ??
                0
            );
            setCurrentPrice(initialPrice);

            if (auction.priceStep) setBidStep(Number(auction.priceStep));

            // const imgList = [];
            // if (auction.variant?.product?.thumbnail) {
            //     imgList.push(auction.variant.product.thumbnail);
            // }
            // if (imgList.length === 0) {
            //     imgList.push("https://via.placeholder.com/800x600?text=No+Image");
            // }
            // setImages(imgList);
            // setSelectedImage(imgList[0]);
            const imgList = [];

            if (auction.variant?.product?.thumbnail) {
                imgList.push(auction.variant.product.thumbnail);
            }

            if (auction.variant?.images?.[0]?.image_url) {
                imgList.push(auction.variant.images[0].image_url);
            }

            if (auction.variant?.images?.length > 1) {
                auction.variant.images.slice(1).forEach(img => {
                    if (img?.image_url) imgList.push(img.image_url);
                });
            }

            if (imgList.length === 0) {
                imgList.push("https://via.placeholder.com/800x600?text=No+Image");
            }

            setImages(imgList);
            setSelectedImage(imgList[0]);


        } catch (error) {
            console.error("Lỗi lấy phiên đang diễn ra:", error);
            // toast.error("Không thể tải phiên đấu giá đang diễn ra.");
        } finally {
            setLoadingAuction(false);
        }
    };

    const shortDescription = useMemo(() => {
        const desc = activeAuction?.variant?.product?.short_description || "";

        return desc || "Sản phẩm đang được đấu giá với nhiều ưu đãi hấp dẫn.";
    }, [activeAuction]);

    const productName = activeAuction?.variant?.product?.name || "Sản phẩm";
    const productSku = activeAuction?.variant?.sku ? ` (${activeAuction.variant.sku})` : "";
    const fullName = productName + productSku;
    const brand = activeAuction?.variant?.product?.brand.name;
    const selectedVariant = activeAuction?.variant;

    const handleBid = async () => {
        if (!activeAuction) return;
        if (isCooldown) return;
        if (bidValue < minAllowed) {
            toast.warning(`Giá tối thiểu phải từ ${formatVnd(minAllowed)}`);
            return;
        }
        if (isMyHighest) {
            toast.info('Bạn đang giữ giá cao nhất, chờ người khác trả.');
            return;
        }

        if (bidInFlightRef.current) return;
        bidInFlightRef.current = true;
        setIsSubmitting(true);

        const idemKey = `${activeAuction.id}:${meId}:${bidValue}`;

        try {
            await axios.post(
                `${Constants.DOMAIN_API}/auctions/${activeAuction.id}/bids`,
                { bidAmount: bidValue },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                        'X-Idempotency-Key': idemKey,
                    },
                }
            );

            setExitLocked(true);
            setStepCount(1);

            setCooldownUntil(new Date(Date.now() + 1000));
        } catch (err) {
            toast.error(err?.response?.data?.message || 'Lỗi khi đặt giá');
        } finally {
            setTimeout(() => {
                bidInFlightRef.current = false;
                setIsSubmitting(false);
            }, 1200);
        }
    };

    useEffect(() => {
        if (!activeAuction) return;
        fetchBids();
    }, [activeAuction]);

    const fetchBids = async () => {
        try {
            const res = await axios.get(`${Constants.DOMAIN_API}/auctions/${activeAuction.id}/bids`);
            const rows = res.data?.data || [];

            let top = null;
            for (const b of rows) {
                if (!top || Number(b.bidAmount) > Number(top.bidAmount)) top = b;
            }

            if (top) {
                setCurrentPrice(Number(top.bidAmount));
                setHighestBidUserId(Number(top.user_id));
            } else {
                setHighestBidUserId(null);

                setCurrentPrice(prev => Number(activeAuction?.current_price ?? prev ?? 0));
            }

            const mapped = rows
                .sort((a, b) => Number(b.bidAmount) - Number(a.bidAmount))
                .map((b) => ({
                    user: b.user_name,
                    amount: Number(b.bidAmount),
                    time: new Date(b.bidTime).toLocaleTimeString('vi-VN', { timeZone: 'UTC' })
                }));

            setBids(mapped);
        } catch (e) {

        }
    };

    const fireworks = useMemo(() => {
        if (!showWinModal) return [];
        const colors = ['#ff4081', '#ffd740', '#40c4ff', '#69f0ae'];
        return Array.from({ length: 12 }).map((_, i) => ({
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            color: colors[i % colors.length],
            delay: `${Math.random() * 0.6}s`,
        }));
    }, [showWinModal]);

    useEffect(() => {
        if (!showWinModal) return;

        const onKeyDown = (e) => {
            const allowed = ['Enter', ' '];
            if (!allowed.includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        const onContextMenu = (e) => e.preventDefault();

        const onBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = 'Bạn đang thanh toán, vui lòng hoàn tất.';
        };

        const push = () => window.history.pushState(null, '', window.location.href);
        push();
        const onPopState = () => {
            push();
            toast.info('Vui lòng thanh toán trước khi rời trang.');
        };

        const swallow = (e) => {
            if (!modalRef.current) return;
            if (!modalRef.current.contains(e.target)) {
                e.preventDefault();
                e.stopPropagation();
            }
        };

        document.addEventListener('click', swallow, true);
        document.addEventListener('mousedown', swallow, true);
        document.addEventListener('touchstart', swallow, true);
        document.addEventListener('contextmenu', onContextMenu, true);
        document.addEventListener('keydown', onKeyDown, true);
        window.addEventListener('beforeunload', onBeforeUnload);
        window.addEventListener('popstate', onPopState);

        return () => {
            document.removeEventListener('click', swallow, true);
            document.removeEventListener('mousedown', swallow, true);
            document.removeEventListener('touchstart', swallow, true);
            document.removeEventListener('contextmenu', onContextMenu, true);
            document.removeEventListener('keydown', onKeyDown, true);
            window.removeEventListener('beforeunload', onBeforeUnload);
            window.removeEventListener('popstate', onPopState);
        };
    }, [showWinModal]);

    useEffect(() => {
        if (countdown.ms <= 0) {
            setExitLocked(false);
        }
    }, [countdown.ms]);

    useEffect(() => {

        const shouldBlock = exitLocked && countdown.ms > 0;
        if (!shouldBlock) return;

        const onBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = "";
        };
        window.addEventListener("beforeunload", onBeforeUnload);

        const push = () => window.history.pushState(null, "", window.location.href);
        push();
        const onPopState = (e) => {
            push();
            toast.info("Bạn đã đặt giá, không thể rời phòng cho đến khi phiên kết thúc.");
        };
        window.addEventListener("popstate", onPopState);

        const onDocumentClick = (e) => {
            const a = e.target.closest("a");
            if (a && a.getAttribute("href")) {
                e.preventDefault();
                toast.warning("Bạn đã đặt giá, không thể rời phòng cho đến khi phiên kết thúc.");
            }
        };
        document.addEventListener("click", onDocumentClick, true);

        return () => {
            window.removeEventListener("beforeunload", onBeforeUnload);
            window.removeEventListener("popstate", onPopState);
            document.removeEventListener("click", onDocumentClick, true);
        };
    }, [exitLocked, countdown.ms]);

    const minPrice = currentPrice + bidStep;

    useEffect(() => {
        if (!showWinModal) return;

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const swallow = (e) => {
            if (!modalRef.current) return;
            if (!modalRef.current.contains(e.target)) {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        document.addEventListener('click', swallow, true);
        document.addEventListener('mousedown', swallow, true);
        document.addEventListener('touchstart', swallow, true);

        const onKeyDown = (e) => {
            const allowed = ['Enter', ' '];
            if (!allowed.includes(e.key)) {
                e.preventDefault();
                e.stopPropagation();
            }
        };
        document.addEventListener('keydown', onKeyDown, true);

        const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', onBeforeUnload);

        const push = () => window.history.pushState(null, '', window.location.href);
        push();
        const onPopState = () => {
            push();
            toast.info('Bạn đã thắng phiên đấu giá, vui lòng xác nhận.');
        };
        window.addEventListener('popstate', onPopState);

        return () => {
            document.body.style.overflow = prevOverflow;
            document.removeEventListener('click', swallow, true);
            document.removeEventListener('mousedown', swallow, true);
            document.removeEventListener('touchstart', swallow, true);
            document.removeEventListener('keydown', onKeyDown, true);
            window.removeEventListener('beforeunload', onBeforeUnload);
            window.removeEventListener('popstate', onPopState);
        };
    }, [showWinModal]);

    const onBidNew = (payload) => {
        if (String(payload.auctionId) !== String(currentAuctionIdRef.current)) return;

        setCurrentPrice(Number(payload.currentPrice) || 0);
        setHighestBidUserId(Number(payload.highestBidUserId) || null);

        setBids((prev) => [
            {
                user: payload.bid.user_name,
                amount: Number(payload.bid.bidAmount),
                time: new Date(payload.bid.bidTime).toLocaleTimeString("vi-VN"),
            },
            ...prev,
        ]);

        // setCooldownUntil(new Date(Date.now() + 10_000));
    };

    useEffect(() => {
        const timer = setInterval(() => {
            if (!cooldownUntil) {
                setCooldownLeft(0);
                return;
            }
            const left = cooldownUntil - Date.now();
            if (left <= 0) {
                setCooldownUntil(null);
                setCooldownLeft(0);
            } else {
                setCooldownLeft(left);
            }
        }, 500);
        return () => clearInterval(timer);
    }, [cooldownUntil]);

    const isCooldown = !!cooldownUntil && Date.now() < cooldownUntil;

    const handleInputChange = (e) => {

        const digitsOnly = e.target.value.replace(/\D/g, "");

        if (digitsOnly === "") {
            setOverridePrice("");
        } else {
            setOverridePrice(Number(digitsOnly));
        }
    };

    const isInvalidBid =
        !activeAuction ||
        isMyHighest ||
        isCooldown ||
        Number(bidValue || 0) < Number(minAllowed);

    return (
        <Layout>
            <style>
                {`
                    @keyframes fadeInZoom {
                    0% { opacity: 0; transform: scale(0.8); }
                    100% { opacity: 1; transform: scale(1); }
                    }
                    @keyframes glow {
                    0% { box-shadow: 0 0 6px rgba(255,255,255,0.3); }
                    50% { box-shadow: 0 0 20px rgba(255,255,255,0.8); }
                    100% { box-shadow: 0 0 6px rgba(255,255,255,0.3); }
                    }
                    .animate-glow {
                    animation: glow 1.8s ease-in-out infinite;
                    }

                    /* Hiệu ứng pop in modal */
                    @keyframes popIn {
                    0% { transform: scale(0.3); opacity: 0; }
                    70% { transform: scale(1.05); opacity: 1; }
                    100% { transform: scale(1); }
                    }
                    .animate-pop-in {
                    animation: popIn 0.6s ease-out forwards;
                    }

                    /* Pháo hoa */
                    .firework {
                    position: absolute;
                    width: 8px;
                    height: 8px;
                    background: #fff;
                    border-radius: 50%;
                    opacity: 0;
                    animation: explode 1.2s ease-out forwards;
                    }
                    @keyframes explode {
                    0% { transform: scale(0); opacity: 1; }
                    80% { transform: scale(1.5); opacity: 1; }
                    100% { transform: scale(0); opacity: 0; }
                    }
                    /* Pop-in: nhỏ -> lớn có nhẹ bounce */
                    @keyframes popIn {
                    0% { transform: scale(0.3); opacity: 0; }
                    70% { transform: scale(1.05); opacity: 1; }
                    100% { transform: scale(1); }
                    }
                    .animate-pop-in { animation: popIn 0.6s ease-out forwards; }

                    /* Overlay mờ dần */
                    @keyframes fadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                    }
                    .overlay-fade { animation: fadeIn .25s ease-out; }

                    /* Pháo hoa */
                    .firework {
                    position: absolute;
                    width: 8px;
                    height: 8px;
                    background: #fff;
                    border-radius: 50%;
                    opacity: 0;
                    animation: explode 1.2s ease-out forwards;
                    }
                    @keyframes explode {
                    0%   { transform: scale(0);   opacity: 1; }
                    80%  { transform: scale(1.5); opacity: 1; }
                    100% { transform: scale(0);   opacity: 0; }
                    }
                    `}
            </style>

            <div
                className="relative bg-center bg-cover h-[400px] flex flex-col items-center justify-center"
                style={{
                    backgroundImage:
                        "url('https://res.cloudinary.com/disgf4yl7/image/upload/v1753806364/ayx4l3umypbc3cwswdza.avif')",
                }}
            >
                <div className="absolute inset-0 bg-black/40"></div>

                {/* Tiêu đề */}
                <div
                    className="relative z-10 px-8 py-4 rounded-xl 
                        from-[#ff416c]/80 to-[#ff4b2b]/80
                        text-3xl md:text-5xl font-extrabold text-white shadow-2xl
                        animate-[fadeInZoom_1s_ease-out]"
                >
                    <span className="tracking-wide drop-shadow-lg">
                        Phòng Đấu Giá Trực Tuyến
                    </span>
                </div>

                {countdown.text && (
                    <div
                        className={`relative z-10 mt-4 px-6 py-2 rounded-2xl shadow-lg text-xl font-bold tracking-wider flex items-center gap-2
      ${countdown.label === "Kết thúc sau"
                                ? "bg-gradient-to-r from-blue-500 to-blue-700 text-white animate-pulse animate-glow"
                                : "bg-gradient-to-r from-blue-500 to-blue-700 text-white animate-glow"
                            }`}
                    >
                        <span className="text-2xl">Kết thúc sau:</span>
                        <span>{countdown.text}</span>
                    </div>
                )}
                <style>
                    {`
      @keyframes fadeInZoom {
        0% { opacity: 0; transform: scale(0.8); }
        100% { opacity: 1; transform: scale(1); }
      }
      @keyframes glow {
        0% { box-shadow: 0 0 6px rgba(255,255,255,0.3); }
        50% { box-shadow: 0 0 20px rgba(255,255,255,0.8); }
        100% { box-shadow: 0 0 6px rgba(255,255,255,0.3); }
      }
      .animate-glow {
        animation: glow 1.8s ease-in-out infinite;
      }
    `}
                </style>
            </div>

            <div className="container-x mx-auto py-12 px-4">
                {loadingAuction ? (
                    <div className="text-center text-gray-500 py-12">Đang tải phiên đang diễn ra...</div>
                ) : !activeAuction ? (
                    <div className="text-center py-12">
                        <div className="inline-block px-6 py-4 
                  bg-gradient-to-r from-blue-400 to-blue-600
                  text-white text-lg font-bold rounded-xl shadow-lg animate-bounce mt-5">
                            Hiện không có phiên đấu giá nào đang diễn ra
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                        <div className="lg:col-span-2">
                            <div className="border p-6 rounded-xl shadow">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                                    <div>
                                        <div className="w-full h-[480px] border border-gray-300 flex justify-center items-center overflow-hidden relative mb-3 rounded-lg">
                                            <img src={selectedImage} alt="Selected" className="object-contain max-h-full" />
                                        </div>
                                        <div className="overflow-x-auto">
                                            <div className="flex gap-2 flex-nowrap">
                                                {images.map((img, index) => (
                                                    <div
                                                        key={index}
                                                        onClick={() => setSelectedImage(img)}
                                                        className="w-[110px] h-[110px] p-[15px] border border-gray-300 cursor-pointer flex-shrink-0 rounded"
                                                    >
                                                        <img
                                                            src={img}
                                                            alt="thumb"
                                                            className={`w-full h-full object-contain ${selectedImage !== img ? "opacity-50" : ""
                                                                }`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <span className="text-gray-500 text-xs font-normal uppercase tracking-wider mb-2 inline-block">
                                            Danh mục: {activeAuction?.variant?.product?.category.name || "Khác"}
                                        </span>

                                        <p
                                            className={`text-xl font-medium text-black mb-2 ${showFullName ? "" : "line-clamp-2"
                                                }`}
                                            title={fullName}
                                        >
                                            {fullName}
                                        </p>
                                        {fullName.length > 50 && (
                                            <button
                                                className="text-blue-600 text-sm font-medium"
                                                onClick={() => setShowFullName((v) => !v)}
                                            >
                                                {showFullName ? "Ẩn bớt" : "Xem thêm"}
                                            </button>
                                        )}

                                        {/* Mô tả ngắn: xem thêm/thu gọn */}
                                        <div className="mb-4 text-sm text-gray-600">
                                            {showFullShortDesc || shortDescription.length <= 100
                                                ? shortDescription
                                                : shortDescription.slice(0, 100) + "..."}
                                            {shortDescription.length > 100 && (
                                                <button
                                                    onClick={() => setShowFullShortDesc(!showFullShortDesc)}
                                                    className="text-blue-600 text-sm font-medium"
                                                >
                                                    {showFullShortDesc ? "Thu gọn" : "Xem thêm"}
                                                </button>
                                            )}
                                        </div>

                                        <div className="mt-4">
                                            <h4 className="font-semibold mb-2">Thông tin biến thể</h4>
                                            <table className="w-full text-left border border-gray-300 rounded overflow-hidden text-sm">
                                                <thead className="bg-gray-100">
                                                    <tr>
                                                        <th className="p-2 border">Tên thuộc tính</th>
                                                        <th className="p-2 border">Giá trị</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {(selectedVariant?.attributeValues || [])
                                                        .slice(0, showAllAttributes ? undefined : 2)
                                                        .map((av) => {
                                                            const attrName = av?.attribute?.name || "";
                                                            const value = av?.value || "";

                                                            const isColor =
                                                                attrName.trim().toLowerCase() === "màu sắc" ||
                                                                attrName.trim().toLowerCase() === "color";

                                                            const looksLikeHex = /^#([0-9A-F]{3}){1,2}$/i.test(value);
                                                            const looksLikeRgb = /^rgb(a)?\(/i.test(value);
                                                            const looksLikeColorName = /^[a-zA-Z]+$/.test(value);

                                                            const showColorChip =
                                                                isColor && (looksLikeHex || looksLikeRgb || looksLikeColorName);

                                                            return (
                                                                <tr key={av.id}>
                                                                    <td className="p-2 border">{attrName || "—"}</td>
                                                                    <td className="p-2 border">
                                                                        {showColorChip ? (
                                                                            <div className="flex items-center gap-2">
                                                                                <div
                                                                                    className="w-6 h-6 rounded border border-gray-400"
                                                                                    style={{ backgroundColor: value }}
                                                                                    title={value}
                                                                                />
                                                                            </div>
                                                                        ) : (
                                                                            <span>{value || "—"}</span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}

                                                    {(!selectedVariant?.attributeValues ||
                                                        selectedVariant.attributeValues.length === 0) && (
                                                            <tr>
                                                                <td colSpan={2} className="p-2 text-gray-500 italic">
                                                                    Chưa có thuộc tính cho biến thể này.
                                                                </td>
                                                            </tr>
                                                        )}
                                                </tbody>
                                                {selectedVariant?.attributeValues?.length > 2 && (
                                                    <div className="text-center mt-2">
                                                        <button
                                                            onClick={() => setShowAllAttributes((prev) => !prev)}
                                                            className="text-blue-600 text-sm font-medium"
                                                        >
                                                            {showAllAttributes ? "Ẩn bớt" : "Xem thêm"}
                                                        </button>
                                                    </div>
                                                )}
                                            </table>
                                        </div>

                                        <div className="mt-6 text-sm text-gray-700">
                                            <p>
                                                <strong>Thương hiệu: </strong> {brand}
                                            </p>
                                        </div>

                                        <div className="mt-6 text-sm">
                                            Giá hiện tại:{" "}
                                            <span className="text-red-500 font-bold">{formatVnd(currentPrice)}</span>
                                        </div>

                                        <div className="mt-2 text-sm text-gray-600">
                                            Bước giá: <strong>{formatVnd(bidStep)}</strong>
                                        </div>

                                        <div className="mt-2 text-sm text-gray-600">
                                            Thời gian kết thúc:{" "}
                                            <strong>
                                                {String(activeAuction.end_time).replace("T", " ").substring(0, 19)}
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Mô tả sản phẩm */}
                            <div className="mt-5">
                                <h4 className="font-semibold mb-2">Mô tả chi tiết:</h4>
                                <div
                                    className={`prose prose-img:rounded-md transition-all duration-300 overflow-hidden 
      ${showFullDescription ? "max-h-full" : "max-h-[300px]"}`}
                                    dangerouslySetInnerHTML={{
                                        __html: activeAuction?.variant?.product?.description || ""
                                    }}
                                />

                                {activeAuction?.variant?.product?.description?.length > 0 && (
                                    <button
                                        onClick={() => setShowFullDescription((prev) => !prev)}
                                        className="mt-2 text-blue-600 text-sm font-medium"
                                    >
                                        {showFullDescription ? "Thu gọn" : "Xem thêm"}
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* CỘT PHẢI: TRẢ GIÁ + LỊCH SỬ */}
                        <div className="lg:col-span-1">
                            <div className="rounded-2xl bg-slate-900 text-slate-100 p-6 shadow-xl ring-1 ring-slate-800">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-base font-semibold flex items-center gap-2">Giá hiện tại</h2>
                                    <div className="text-lg font-bold text-red-500">{formatVnd(currentPrice)}</div>
                                </div>

                                <div className="mt-4">
                                    <div className="text-xs text-slate-400 mb-2">Bước giá</div>
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="px-4 py-2 bg-slate-800 rounded-lg font-semibold">
                                            {formatVnd(bidStep)}
                                        </div>
                                        <div className="text-slate-400 font-bold">×</div>
                                        <div className="flex items-center gap-3 bg-slate-800 rounded-lg px-3 py-2">
                                            <button
                                                type="button"
                                                onClick={() => setStepCount((c) => Math.max(1, c - 1))}
                                                className="w-7 h-7 grid place-content-center rounded-full border border-slate-600 text-slate-200"
                                                aria-label="Giảm"
                                            >
                                                -
                                            </button>
                                            <div className="min-w-[24px] text-center font-semibold">{stepCount}</div>
                                            <button
                                                type="button"
                                                onClick={() => setStepCount((c) => Math.min(99, c + 1))}
                                                className="w-7 h-7 grid place-content-center rounded-full border border-slate-600 text-emerald-400"
                                                aria-label="Tăng"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="my-4 h-px bg-slate-800" />

                                <div className="text-center font-medium text-green-500">
                                    {formatVnd(minPrice)}
                                </div>
                                <div className="text-center text-xs text-slate-400 mt-1">
                                    Giá tối thiểu có thể đặt
                                </div>

                                {/* <button
                                    type="button"
                                    onMouseDown={(e) => {
                                        if (isInvalidBid) e.preventDefault();
                                    }}
                                    onClick={() => {
                                        if (isInvalidBid) return;
                                        handleBid();
                                    }}
                                    className={`mt-4 w-full h-12 rounded-full font-semibold shadow
                                    ${isCooldown
                                            ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                            : 'bg-blue-200 hover:bg-blue-300 text-blue-900'
                                        }`}
                                >
                                    {isCooldown
                                        ? `Đang tạm khóa (${Math.ceil(cooldownLeft / 1000)}s)`
                                        : <>Trả giá <span className="font-extrabold">{formatVnd(bidValue)}</span></>
                                    }
                                </button> */}

                                <button
                                    type="button"
                                    onMouseDown={(e) => { if (isInvalidBid || isSubmitting) e.preventDefault(); }}
                                    onClick={() => {
                                        if (isInvalidBid || isSubmitting) return;
                                        handleBid();
                                    }}
                                    disabled={isInvalidBid || isSubmitting}
                                    className={`mt-4 w-full h-12 rounded-full font-semibold shadow
                                     ${(isCooldown || isSubmitting)
                                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                                : 'bg-blue-200 hover:bg-blue-300 text-blue-900'}
                                    `}
                                >
                                    {isCooldown
                                        ? `Đang tạm khóa (${Math.ceil(cooldownLeft / 1000)}s)`
                                        : isSubmitting
                                            ? 'Đang gửi...'
                                            : <>Trả giá <span className="font-extrabold">{formatVnd(bidValue)}</span></>
                                    }
                                </button>

                                {/* ====== Ô nhập giá thủ công ====== */}
                                <div className="mt-4">
                                    <label className="block text-sm font-medium text-gray-200 mb-1">
                                        Hoặc nhập giá:
                                    </label>
                                    <input
                                        type="text"
                                        min={minAllowed}
                                        step={bidStep}
                                        value={
                                            overridePrice === ""
                                                ? ""
                                                : overridePrice.toLocaleString("vi-VN")
                                        }
                                        onChange={handleInputChange}
                                        onBlur={() => {
                                            // if (overridePrice === "" || overridePrice < minAllowed) {
                                            //     setOverridePrice(minAllowed);
                                            // }
                                        }}
                                        className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-600 focus:outline-none"
                                    />
                                    {/* <div className="text-xs text-slate-400 mt-1">
                                        Giá ≥ {formatVnd(minAllowed)}, step = {formatVnd(bidStep)}
                                    </div> */}
                                    {overridePrice < minAllowed && (
                                        <p className="text-red-500 text-sm mt-1">
                                            Giá phải lớn hơn hoặc bằng {formatVnd(minAllowed)}
                                        </p>
                                    )}
                                </div>

                                {isMyHighest && (
                                    <div className="mt-2 text-center text-amber-400 text-sm">
                                        Bạn đang giữ giá cao nhất, hãy chờ người khác trả giá.
                                    </div>
                                )}

                                <div className="mt-2 text-center text-slate-400 text-sm">
                                    {amountInWords}
                                </div>
                            </div>

                            <div className="mt-6 border p-4 rounded-xl shadow max-h-[300px] overflow-y-auto">
                                <h3 className="text-lg font-bold mb-2">Lịch sử đấu giá</h3>
                                {bids.length === 0 ? (
                                    <p className="text-gray-500">Chưa có ai đặt giá</p>
                                ) : (
                                    <ul className="text-sm space-y-2">
                                        {bids.map((bid, idx) => (
                                            <li key={idx} className="flex justify-between border-b pb-1">
                                                <span className="truncate max-w-[40%]">{bid.user}</span>
                                                <span className="text-blue-600 font-medium">
                                                    {bid.amount.toLocaleString("vi-VN")}đ
                                                </span>
                                                <span className="text-gray-400 text-xs">{bid.time}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {showWinModal && winInfo && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center"
                    onClick={(e) => e.preventDefault()}
                >

                    <div className="absolute inset-0 bg-black/50 overlay-fade" />

                    {fireworks.map((fw, idx) => (
                        <div
                            key={idx}
                            className="firework"
                            style={{
                                top: fw.top,
                                left: fw.left,
                                background: fw.color,
                                animationDelay: fw.delay,
                            }}
                        />
                    ))}

                    <div ref={modalRef}
                        className="relative mx-4 w-full max-w-md rounded-2xl bg-blue-to-r from-pink-500 via-red-400 to-yellow-400 p-1 shadow-2xl animate-pop-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="bg-white rounded-2xl p-6 relative">

                            <div className="flex items-center justify-center">
                                <div className="h-16 w-16 rounded-full bg-green-100 grid place-content-center">
                                    <span className="text-3xl">🎉</span>
                                </div>
                            </div>
                            <h3 className="mt-4 text-center text-2xl font-extrabold text-pink-600">
                                Chúc mừng! Bạn đã thắng phiên đấu giá
                            </h3>
                            <p className="mt-3 text-center text-gray-700 text-lg">
                                <span className="font-bold text-purple-600">Sản phẩm đã được thêm vào giỏ hàng! </span>
                            </p>
                            <p className="mt-2 text-center text-gray-800 font-medium">
                                Giá chiến thắng:
                                <span className="text-red-600 font-bold">
                                    {" "}{Number(winInfo.amount || 0).toLocaleString("vi-VN")} ₫
                                </span>
                            </p>
                            <p className="mt-2 text-center text-sm text-red-600">
                                Vui lòng thanh toán trước hạn
                                nếu không bạn sẽ bị trừ 10% số tiền thắng cược trong ví và nếu 3 lần không thanh toán
                                bạn sẽ bị cấm đấu giá vĩnh viễn!
                            </p>

                            <div className="mt-6 grid gap-3 text-center">
                                <button
                                    onClick={() => {
                                        setShowWinModal(false);
                                        navigate("/cart");
                                    }}
                                    className="h-11 rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 font-semibold text-white hover:from-blue-600 hover:to-blue-600 text-center"
                                >
                                    Thanh toán ngay
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </Layout>
    );
}