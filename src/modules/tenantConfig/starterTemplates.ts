export const potteryTemplate = {
  templateId: 'pottery-template',
  theme: {
    primaryColor: '#8B5A2B', // Terracotta Clay Brown
    accentColor: '#C4952A', // Turmeric Gold
    fontHeading: 'Cormorant Garamond',
    fontBody: 'Be Vietnam Pro',
    logo: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=100&h=100&fit=crop&q=80',
    favicon: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=32&h=32&fit=crop&q=80',
  },
  sections: [
    {
      id: 'pottery-hero',
      type: 'hero',
      title: {
        vi: 'Hồn Đất Gia Lâm Gốm Sứ Bát Tràng',
        en: 'The Clay Soul of Bat Trang Ceramics',
      },
      subtitle: {
        vi: 'Nơi lưu giữ nét đẹp tinh xảo hơn 700 năm của nghệ thuật nhào nặn đất sét và lửa men rạn trứ danh.',
        en: 'Preserving over 700 years of exquisite hand-kneaded clay craftsmanship and iconic crackle glaze.',
      },
      backgroundImage: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=1800&q=80',
      primaryCta: {
        label: { vi: 'Khám phá sản phẩm', en: 'Browse Masterworks' },
        link: '#products',
      },
      secondaryCta: {
        label: { vi: 'Đặt Lịch Trải Nghiệm', en: 'Book Workshop' },
        link: '#experiences',
      },
    },
    {
      id: 'pottery-story',
      type: 'story',
      heading: {
        vi: 'Hành Trình Tinh Tế Của Đất & Lửa',
        en: 'The Delicate Journey of Clay & Fire',
      },
      storyText: {
        vi: 'Để làm nên một tác phẩm gốm Bát Tràng trứ danh, người nghệ nhân phải trải qua quy trình nghiêm ngặt từ chọn đất tràng sét, lắng lọc bùn mịn, xoay chuốt trên bàn xoay thủ công, vẽ tay tỉ mỉ và nung đun lò đạt tới 1200 độ C. Mỗi bình vẽ sen men lam hay hũ rạn cổ đều mang một nét tâm thức độc bản.',
        en: 'To sculpt a classic Bat Trang masterpiece, artisans undergo a rigorous process: selecting white clay, filtering fine silt, hand-turning on kick wheels, meticulous hand-painting, and firing up to 1200°C. Every hand-painted blue-and-white celadon or antique crackled vase tells a completely unique story.',
      },
      artisanName: {
        vi: 'Nghệ nhân ưu tú Nguyễn Văn Minh',
        en: 'Master Artisan Nguyen Van Minh',
      },
      artisanTitle: {
        vi: 'Bàn Tay Vàng 45 năm gìn giữ lò nung cổ',
        en: '45-year Golden Hands preserving historic kilns',
      },
      image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
      quote: {
        vi: 'Đất là xương thịt, men là xiêm y, lửa là linh hồn thổi hồn cốt tế vi cho gốm.',
        en: 'Clay is the bone, glaze is the gown, and fire is the sacred soul that breathes life into pottery.',
      },
    },
    {
      id: 'pottery-products',
      type: 'products',
      heading: {
        vi: 'Kiệt Tác Gốm Men Rạn Cổ',
        en: 'Antique Crackled Masterworks',
      },
      subheading: {
        vi: 'Các bộ ấm trà, bình hút lộc phong thủy được phục dựng tỉ mỉ từ dáng gốm cổ Lý - Trần.',
        en: 'Collectable tea sets and spiritual wealth urns faithfully restored from the Ly-Tran Dynasty styles.',
      },
    },
    {
      id: 'pottery-experiences',
      type: 'experiences',
      heading: {
        vi: 'Khóa Học Làm Gốm Nghệ Thuật',
        en: 'Authentic Ceramic Classes',
      },
      subheading: {
        vi: 'Đích thân nhào nặn đất sét, vẽ họa tiết cổ dưới sự kèm cặp từ truyền nhân làng nghề Bát Tràng.',
        en: 'Squeeze the clay, guide the wheel, and glaze under the direct tutoring of traditional master lineage.',
      },
      items: [
        {
          title: {
            vi: 'Trải Nghiệm Xoay Gốm Cơ Bản',
            en: 'Kick-wheel Throwing Workshop',
          },
          description: {
            vi: 'Học cách định hình phôi gốm tròn trên bàn xoay, làm ly, chén hoặc đĩa mộc mạc.',
            en: 'Learn the core centering techniques on standard kick wheels. Make your own rustic cups or plates.',
          },
          image: 'https://images.unsplash.com/photo-1565192647048-f997ded879ab?auto=format&fit=crop&w=600&q=80',
          price: 250000,
          duration: '2 giờ (2 hours)',
        },
        {
          title: {
            vi: 'Vẽ Tay Hoa Văn Trên Gốm Sứ',
            en: 'Delicate Hand-Painting masterclass',
          },
          description: {
            vi: 'Vẽ oxit coban màu lam cổ điển lên gốm đã mộc, được nghệ nhân tráng men tro cổ nung sấy.',
            en: 'Paint cobalt oxide blue pigments onto raw clay, coated in wood ash glaze and kiln fired for you.',
          },
          image: 'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&w=600&q=80',
          price: 450000,
          duration: '3 giờ (3 hours)',
        },
      ],
    },
    {
      id: 'pottery-gallery',
      type: 'gallery',
      heading: {
        vi: 'Góc Nhìn Lò Nung Cổ Kính',
        en: 'Moments by the Ancient Kilns',
      },
      subheading: {
        vi: 'Khoảnh khắc ghi dấu công việc thầm lặng đầy chất thơ của nghệ nhân Bát Tràng.',
        en: 'Visual records highlighting the poetic and quiet work of pottery artisans.',
      },
      images: [
        {
          url: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80',
          caption: { vi: 'Hàng trăm phôi gốm phơi sấy dưới ánh nắng trời tự nhiên', en: 'Hundreds of greenware pieces drying under golden sunshine' },
        },
        {
          url: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
          caption: { vi: 'Sơn trét và tỉ mỉ nặn dán đắp nổi hoa văn rồng nổi', en: 'Intricately detailing and carving 3D dragon patterns onto clay jars' },
        },
      ],
    },
    {
      id: 'pottery-testimonials',
      type: 'testimonials',
      heading: {
        vi: 'Tình Yêu Gốm Sứ Lan Tỏa',
        en: 'Admiration for Vietnamese Pottery',
      },
      items: [
        {
          quote: {
            vi: 'Lần đầu tiên tôi tự tay định hình đĩa gốm trên bàn xoay chân gỗ. Sự yên bình và tinh xảo của Bát Tràng làm tôi vô cùng xúc động.',
            en: 'My first time turning a plate on a wooden wheel. The serenity and meticulousness of Bat Trang deeply moved me.',
          },
          author: 'Sophia Lorenz',
          role: 'Du khách từ Đức (Traveler from Germany)',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
        },
      ],
    },
    {
      id: 'pottery-cta',
      type: 'cta',
      heading: {
        vi: 'Khám Phá Di Sản Gốm Việt Nam',
        en: 'Inherit the Legacy of Vietnamese Ceramics',
      },
      description: {
        vi: 'Đăng ký nhận cẩm nang di sản, danh mục sản phẩm phục chế giới hạn và các suất ưu đãi trải nghiệm lò bầu cổ cổ kính.',
        en: 'Subscribe for heritage guidebooks, limited-run restoration catalogs, and unique VIP access to ancient beehive kilns.',
      },
      buttonText: { vi: 'Đăng ký ngay', en: 'Subscribe Now' },
      buttonLink: '#',
    },
    {
      id: 'pottery-map',
      type: 'map',
      heading: {
        vi: 'Đến Với Làng Gốm Bát Tràng',
        en: 'Find Us in Bat Trang Village',
      },
      coordinates: [105.9327, 20.9733],
      address: {
        vi: 'Xóm 3, Làng Cổ Bát Tràng, Gia Lâm, Hà Nội',
        en: 'Xom 3, Bat Trang Ancient Village, Gia Lam, Hanoi',
      },
      phone: '+84 24 3874 0123',
      hours: {
        vi: 'Thứ 2 - Chủ Nhật, 08:00 - 18:00',
        en: 'Mon - Sun, 08:00 AM - 06:00 PM',
      },
    },
  ],
};

export const silkTemplate = {
  templateId: 'silk-template',
  theme: {
    primaryColor: '#8B1A1A', // Cinnabar/Lacquer Red
    accentColor: '#C4952A', // Golden Yellow
    fontHeading: 'Playfair Display',
    fontBody: 'Be Vietnam Pro',
    logo: 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=100&h=100&fit=crop&q=80',
    favicon: 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=32&h=32&fit=crop&q=80',
  },
  sections: [
    {
      id: 'silk-hero',
      type: 'hero',
      title: {
        vi: 'Mượt Mà Sợi Tơ Làng Lụa Vạn Phúc',
        en: 'The Fluid Elegance of Van Phuc Silk',
      },
      subtitle: {
        vi: 'Nghệ thuật dệt tơ tằm nguyên bản lưu truyền hơn một thiên niên kỷ, lấp lánh sắc hoa văn chìm tinh xảo quý phái.',
        en: 'Over a millennium of pure mulberry silk weaving heritage, shining with luxurious and subtle woven jacquard patterns.',
      },
      backgroundImage: 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&w=1800&q=80',
      primaryCta: {
        label: { vi: 'Bộ Sưu Tập Lụa Gấm', en: 'Brocade Collection' },
        link: '#products',
      },
      secondaryCta: {
        label: { vi: 'Hành Trình Tơ Tằm', en: 'Mulberry Workshops' },
        link: '#experiences',
      },
    },
    {
      id: 'silk-story',
      type: 'story',
      heading: {
        vi: 'Nghệ Thuật Dệt Hoa Vân Gấm Phố cổ',
        en: 'The Mastercraft of Antique Brocade Jacquard',
      },
      storyText: {
        vi: 'Lụa Vạn Phúc (lụa Hà Đông) nổi danh với hoa văn dệt chìm sang trọng — sờ ấm vào mùa đông, mát rượi vào mùa hè. Từng mét lụa gấm thêu tay đều trải qua hàng ngàn nhịp sợi con thoi vang lên giòn giã từ những khung gỗ dệt cổ xưa. Sợi tơ tằm tự nhiên được kén tằm vàng óng từ đôi bàn tay của các nghệ nhân Hà thành nâng niu.',
        en: 'Van Phuc Silk is globally renowned for its subtle woven jacquard patterns—warm to the touch in winter, breathably cool in summer. Every yard of hand-woven silk is born from thousands of shuttle strokes echoing rhythmically on ancient wooden looms. Organic golden silks are spun and dyed with natural botanicals by native Hanoi craftsmen.',
      },
      artisanName: {
        vi: 'Nghệ nhân Nhân dân Triệu Quốc Khương',
        en: 'People’s Artisan Trieu Quoc Khuong',
      },
      artisanTitle: {
        vi: 'Truyền nhân đời thứ 5 gìn giữ hoa văn khơi dòng sử sách',
        en: '5th generation master preserving imperial patterns',
      },
      image: 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&w=800&q=80',
      quote: {
        vi: 'Sợi tơ mỏng manh như hơi thở, dệt thành lụa mịn màng như làn mây trời thu.',
        en: 'Each silk thread is as delicate as a gentle breath, woven into a drape as smooth as autumn clouds.',
      },
    },
    {
      id: 'silk-products',
      type: 'products',
      heading: {
        vi: 'Lụa Tơ Tằm Thượng Hạng',
        en: 'Elite Mulberry Silkwear',
      },
      subheading: {
        vi: 'Những chiếc áo dài gấm hoa chìm dệt truyền thống, khăn lụa tơ tằm thêu tay hoa sen độc bản quyến rũ.',
        en: 'Hand-tailored brocade Ao Dai gowns and hand-embroidered pure lotus silk scarves.',
      },
    },
    {
      id: 'silk-gallery',
      type: 'gallery',
      heading: {
        vi: 'Sắc Màu Trên Từng Sợi Dệt',
        en: 'Colors Spun Across the Looms',
      },
      subheading: {
        vi: 'Phơi nhuộm tơ lụa rực rỡ và những guồng quay cuộn kén tằm vàng óng.',
        en: 'Vibrant sun-dried silk strands and antique spinning wheels twisting raw cocoons.',
      },
      images: [
        {
          url: 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&w=800&q=80',
          caption: { vi: 'Hàng ngàn guồng tơ tằm vàng óng ả chờ se sợi dệt', en: 'Thousands of golden silk cocoon skeins awaiting twisting' },
        },
      ],
    },
    {
      id: 'silk-experiences',
      type: 'experiences',
      heading: {
        vi: 'Trải Nghiệm Dệt Lụa Thủ Công',
        en: 'Artisanal Silk Workshops',
      },
      subheading: {
        vi: 'Tìm hiểu vòng đời con tằm ăn lá dâu, học luộc kén se sợi dệt lụa dệt sồi hoa.',
        en: 'Discover the lifecycle of silkworms, boil golden cocoons, and shuttle raw silk strands.',
      },
      items: [
        {
          title: {
            vi: 'Hành Trình Se Tơ & Uơm Kén',
            en: 'Cocoon Boiling & Silk Reeling',
          },
          description: {
            vi: 'Tìm hiểu nghệ thuật luộc kén tằm lấy sợi tơ nguyên bản siêu bền từ vỏ kén thô.',
            en: 'Extract ultra-fine silk filaments from fresh organic cocoons on traditional reeling pots.',
          },
          image: 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&w=600&q=80',
          price: 300000,
          duration: '1.5 giờ (1.5 hours)',
        },
      ],
    },
    {
      id: 'silk-testimonials',
      type: 'testimonials',
      heading: {
        vi: 'Khách Hàng Nói Về Lụa Vạn Phúc',
        en: 'Voices Embracing Van Phuc Silk',
      },
      items: [
        {
          quote: {
            vi: 'Khoác lên mình tà áo dài lụa gấm Vạn Phúc dệt chìm hoa cúc phượng, tôi cảm thấy sự kiêu hãnh và vẻ quyến rũ khác biệt từ tà áo đậm hồn văn hiến Việt.',
            en: 'Wearing the jacquard silk Ao Dai patterned with royal chrysanthemums, I feel a rare pride and unique dignity woven from centuries of culture.',
          },
          author: 'Hoa hậu Hữu nghị Nguyễn Thu Thảo',
          role: 'Đại sứ văn hóa (Culture Ambassador)',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
        },
      ],
    },
    {
      id: 'silk-cta',
      type: 'cta',
      heading: {
        vi: 'Sở Hữu Tấm Lụa Đi Cùng Thời Gian',
        en: 'Acquire Timeless Masterpieces in Silk',
      },
      description: {
        vi: 'Nhận thư mời ra mắt các thiết kế áo dài thiết kế riêng giới hạn và xem các phiên vẽ vẽ tay trên lụa duy nhất.',
        en: 'Get premium invites to private limited-edition custom tailors and unique hand-painted silk preview events.',
      },
      buttonText: { vi: 'Yêu cầu tư vấn riêng', en: 'Request Tailoring Consultation' },
      buttonLink: '#',
    },
    {
      id: 'silk-map',
      type: 'map',
      heading: {
        vi: 'Không Gian Trưng Bày Lụa Vạn Phúc',
        en: 'Our Exhibition space in Van Phuc',
      },
      coordinates: [105.7725, 20.9767],
      address: {
        vi: 'Cổng chào Làng Lụa Vạn Phúc, Vạn Phúc, Hà Đông, Hà Nội',
        en: 'Main Gate of Van Phuc Silk Village, Ha Dong District, Hanoi',
      },
      phone: '+84 24 3382 0456',
      hours: {
        vi: 'Thứ 2 - Chủ Nhật, 08:30 - 21:00',
        en: 'Mon - Sun, 08:30 AM - 09:00 PM',
      },
    },
  ],
};

export const minimalTemplate = {
  templateId: 'minimal-template',
  theme: {
    primaryColor: '#2E2318', // Deep Charcoal
    accentColor: '#7A5C2E', // Bronze
    fontHeading: 'Cormorant Garamond',
    fontBody: 'Be Vietnam Pro',
    logo: 'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?w=100&h=100&fit=crop&q=80',
    favicon: 'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?w=32&h=32&fit=crop&q=80',
  },
  sections: [
    {
      id: 'min-hero',
      type: 'hero',
      title: {
        vi: 'Nghệ Thuật Tranh Đông Hồ - Điệp Giấy Dó',
        en: 'The Poetics of Dong Ho Woodblock Printing',
      },
      subtitle: {
        vi: 'Sự tinh giản mộc mạc lưu hồn cội nguồn văn hóa Việt trên chất điệp sò điệp lấp lánh óng ánh dưới nắng vàng.',
        en: 'Preserving rustic and traditional folklore woodblock prints painted on organic shells-crushed Dó papers.',
      },
      backgroundImage: 'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&w=1800&q=80',
      primaryCta: {
        label: { vi: 'Xem Bản Khắc', en: 'View Woodblocks' },
        link: '#products',
      },
    },
    {
      id: 'min-story',
      type: 'story',
      heading: {
        vi: 'Khắc Họa Linh Hồn Việt Trên Điệp Dó',
        en: 'Engraving Vietnamese Soul onto Shell-Dusted Dó Paper',
      },
      storyText: {
        vi: 'Mỗi bản khắc gỗ tranh Đông Hồ không phô trương sắc màu sặc sỡ mà tự hào chắt chiu năm màu tự nhiên mộc mạc: màu đen óng của than lá tre, đỏ ấm gạch nung của sỏi đồi, vàng rơm hạt dành dành, màu xanh lục lá chàm và màu trắng điệp vỏ sò lấp lánh nghiền mịn quét chổi lá thông.',
        en: 'Every Dong Ho folk woodblock print avoids bright chemical inks, honoring five organic colors: black charcoal of burnt bamboo leaves, warm rust of hillside clay, straw yellow of gardenia seeds, green of indigo plants, and glowing pearl dust crushed from scallop shells swept by pine needle brushes.',
      },
      artisanName: {
        vi: 'Nghệ nhân ưu tú Nguyễn Hữu Quả',
        en: 'Master Artisan Nguyen Huu Qua',
      },
      artisanTitle: {
        vi: 'Dòng dõi lâu đời lưu truyền bí pháp giã điệp quét hồ',
        en: 'Noble lineage preserving shell-dusting paper glaze secrets',
      },
      image: 'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 'min-products',
      type: 'products',
      heading: {
        vi: 'Tranh Dân Folk Độc Bản',
        en: 'Original Folkart Woodblocks',
      },
      subheading: {
        vi: 'Những ấn phẩm rước rồng, đàn lợn chăn tằm, cá chép trông trăng dập vẽ tay.',
        en: 'Poetic prints featuring pig families, dragon dances, and carps contemplating the full moon.',
      },
    },
    {
      id: 'min-cta',
      type: 'cta',
      heading: {
        vi: 'Gìn Giữ Hồn Tranh Điệp Việt Nam',
        en: 'Preserve the Polish of Vietnamese Folk Art',
      },
      description: {
        vi: 'Đồng hành cùng di sản làng nghề, nhận thông tin các buổi triển lãm mộc bản quốc tế hàng tháng.',
        en: 'Walk side-by-side with our heritage. Get invitations to monthly international woodblock exhibitions.',
      },
      buttonText: { vi: 'Đồng hành cùng di sản', en: 'Partner with Heritage' },
      buttonLink: '#',
    },
  ],
};

export const getStarterTemplate = (tenantSlug: string) => {
  if (tenantSlug === 'van-phuc') {
    return silkTemplate;
  }
  if (tenantSlug === 'bat-trang') {
    return potteryTemplate;
  }
  return minimalTemplate;
};
