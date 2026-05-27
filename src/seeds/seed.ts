import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { User } from '../models/User.model';
import { Village } from '../models/Village.model';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hoalang';

const seedDatabase = async (): Promise<void> => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(MONGODB_URI);
    console.log('Database connected successfully.');

    // 1. Clean existing records
    console.log('Clearing existing collections...');
    await User.deleteMany({});
    await Village.deleteMany({});
    console.log('Collections cleared.');

    // 2. Create Default Admin user
    console.log('Creating Admin account...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Admin@123', salt);

    const adminUser = new User({
      email: 'admin@restx.food',
      name: 'Super Admin',
      password: hashedPassword,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      role: 'ADMIN',
      locale: 'vi'
    });

    await adminUser.save();
    console.log('Admin account created successfully.');

    // 3. Create 10 traditional Vietnamese craft villages
    console.log('Seeding 10 Vietnamese craft villages...');
    
    const villagesData = [
      {
        slug: 'bat-trang',
        name: {
          vi: 'Lang gom Bat Trang',
          en: 'Bat Trang Ceramic Village',
          ja: 'バッチャン陶器村',
          ko: '밧짱 도자기 마을',
          zh: '巴特庄陶瓷村'
        },
        desc: {
          vi: 'Lang nghe gom su truyen thong noi tieng tai Gia Lam, Ha Noi voi lich su hon 700 nam phat trien thu cong tinh xao.',
          en: 'Famous traditional ceramic village located in Gia Lam, Hanoi with a history of over 700 years of exquisite craftsmanship.',
          ja: 'ハノイのザーラム県にある有名な伝統陶芸の村で、700年以上の精巧な職人技の歴史があります。',
          ko: '하노이 자람현에 위치한 유명한 전통 도자기 마을로, 700년 이상의 정교한 장인정신 역사를 가지고 있습니다.',
          zh: '位于河内嘉林的著名传统陶瓷手艺村，拥有700多年的精湛手工艺发展历史。'
        },
        province: 'Ha Noi',
        location: {
          type: 'Point',
          coordinates: [105.9327, 20.9733] // [lng, lat]
        },
        categories: ['gom', 'dat nung'],
        images: [
          'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80'
        ],
        isVerified: true,
        ownerId: adminUser._id
      },
      {
        slug: 'van-phuc',
        name: {
          vi: 'Lang lua Van Phuc',
          en: 'Van Phuc Silk Village',
          ja: 'ヴァンフック絹織物村',
          ko: '반푹 실크 마을',
          zh: '万福丝绸村'
        },
        desc: {
          vi: 'Lang nghe det lua lau doi nhat tai Ha Dong, Ha Noi, noi tieng voi cac loai lua to tam tu nhien mem mai, mong manh cat canh quoc te.',
          en: 'The oldest silk-weaving craft village in Ha Dong, Hanoi, renowned for soft natural silk sheets exported internationally.',
          ja: 'ハノイのハドン区にある最古の絹織物村で、国際的に輸出されている柔らかく天然のシルクで知られています。',
          ko: '하노이 하동구에 위치한 가장 오래된 실크 짜기 공예 마을로, 세계적으로 수출되는 부드러운 천연 실크로 유명합니다.',
          zh: '河内哈东最古老的丝织手艺村，以出口国际的柔软天然桑蚕丝而闻名。'
        },
        province: 'Ha Noi',
        location: {
          type: 'Point',
          coordinates: [105.7725, 20.9767]
        },
        categories: ['det lua', 'to tam'],
        images: [
          'https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&w=800&q=80'
        ],
        isVerified: true,
        ownerId: adminUser._id
      },
      {
        slug: 'dong-ho',
        name: {
          vi: 'Lang tranh Dong Ho',
          en: 'Dong Ho Painting Village',
          ja: 'ドンホー版画村',
          ko: '동호 민화 마을',
          zh: '东湖民间版画村'
        },
        desc: {
          vi: 'Lang nghe in tranh khac go dan gian dac sac tai Thuan Thanh, Bac Ninh giu gin hon cot tinh hoa truyen thong Viet.',
          en: 'Historic folk woodblock printing village in Thuan Thanh, Bac Ninh, preserving rustic and traditional folklore.',
          ja: 'バクニン省トゥアンタイン県にある歴史的な木版画の民俗村で、素朴で伝統的な民間伝承を保存しています。',
          ko: '박닌성 투언타인현에 위치한 역사적인 민속 목판화 인쇄 마을로, 소박하고 전통적인 민속 유산을 보존하고 있습니다.',
          zh: '位于北宁顺成的历史悠久的民间木刻版画村，保留了越南传统文化的朴实精髓。'
        },
        province: 'Bac Ninh',
        location: {
          type: 'Point',
          coordinates: [106.0744, 21.0967]
        },
        categories: ['tranh khac go', 'giay do'],
        images: [
          'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&w=800&q=80'
        ],
        isVerified: true,
        ownerId: adminUser._id
      },
      {
        slug: 'thanh-ha',
        name: {
          vi: 'Lang gom Thanh Ha',
          en: 'Thanh Ha Pottery Village',
          ja: 'タインハー陶器村',
          ko: '탄하 도자기 마을',
          zh: '青河陶艺村'
        },
        desc: {
          vi: 'Lang gom doc dao nam ben dong song Thu Bon tai Hoi An, Quang Nam, noi tieng voi gom dat nung mau do gach am ap.',
          en: 'Unique pottery village along the Thu Bon River in Hoi An, Quang Nam, famous for its rustic terracotta pottery.',
          ja: 'クアンナム省ホイアンのトゥボン川沿いにあるユニークな陶器の村で、素朴なテラコッタ陶器で有名です。',
          ko: '광남성 호이안의 투본강 변에 위치한 독특한 도자기 마을로, 소박한 테라코ッタ 도자기로 유명합니다.',
          zh: '位于广南会安秋盆河畔的独特陶艺村，以其温暖红砖色的质朴陶器而闻名。'
        },
        province: 'Quang Nam',
        location: {
          type: 'Point',
          coordinates: [108.3072, 15.8825]
        },
        categories: ['gom dat nung', 'my nghe'],
        images: [
          'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80'
        ],
        isVerified: true,
        ownerId: adminUser._id
      },
      {
        slug: 'ma-chau',
        name: {
          vi: 'Lang det Ma Chau',
          en: 'Ma Chau Weaving Village',
          ja: 'マーチャウ織物村',
          ko: '마짜우 직조 마을',
          zh: '马洲丝织村'
        },
        desc: {
          vi: 'Lang det to tam truyen thong lau doi tai Duy Xuyen, Quang Nam, gin giu phuong thuc uom to det lua thien nhien.',
          en: 'Long-standing traditional silk weaving village in Duy Xuyen, Quang Nam, preserving organic silk manufacturing.',
          ja: 'クアンナム省ズイスエン県にある長い歴史を持つ伝統的な絹織物の村で、有機シルクの製造を守り続けています。',
          ko: '광남성 주이쑤옌현에 위치한 오래된 전통 실크 직조 마을로, 유기농 실크 제조 방식을 보존하고 있습니다.',
          zh: '位于广南潍川的悠久传统桑蚕丝织村，保留了天然蚕丝的缫丝与织造工艺。'
        },
        province: 'Quang Nam',
        location: {
          type: 'Point',
          coordinates: [108.2433, 15.8458]
        },
        categories: ['det lua', 'uom to'],
        images: [
          'https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&w=800&q=80'
        ],
        isVerified: true,
        ownerId: adminUser._id
      },
      {
        slug: 'phuoc-kieu',
        name: {
          vi: 'Lang duc dong Phuoc Kieu',
          en: 'Phuoc Kieu Bronze Casting Village',
          ja: 'フオックキエウ青銅鋳造村',
          ko: '푸옥끼에우 청동 주조 마을',
          zh: '福桥青铜铸造村'
        },
        desc: {
          vi: 'Lang nghe duc dong lung danh dat Quang Nam, noi lam ra cac loai chieng, thanh, xoong chao phuc vu am nhac cung dinh va sinh hoat.',
          en: 'Famous bronze casting village in Quang Nam, making traditional gongs and musical bronze wares.',
          ja: 'クアンナム省にある有名な青銅鋳造の村で、伝統的な銅鑼や楽器用の青銅製品を制作しています。',
          ko: '광남성에 위치한 유명한 청동 주조 마을로, 전통 징과 음악용 청동 제품을 제작하고 있습니다.',
          zh: '广南著名的青铜铸造村，制作用于宫廷音乐和日常生活的传统铜锣、铜磬等铜器。'
        },
        province: 'Quang Nam',
        location: {
          type: 'Point',
          coordinates: [108.2325, 15.8592]
        },
        categories: ['duc dong', 'nhac cu'],
        images: [
          'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&w=800&q=80'
        ],
        isVerified: true,
        ownerId: adminUser._id
      },
      {
        slug: 'non-chuong',
        name: {
          vi: 'Lang non Chuong',
          en: 'Chuong Conical Hat Village',
          ja: 'チュオン帽子村',
          ko: '쯔엉 논라 마을',
          zh: '钟村斗笠村'
        },
        desc: {
          vi: 'Lang nghe lam non la truyen thong dac sac tai Thanh Oai, Ha Noi, bieu tuong net dep duyen dang cua phu nu Viet.',
          en: 'Exceptional conical hat weaving village in Thanh Oai, Hanoi, representing the elegant grace of Vietnamese ladies.',
          ja: 'ハノイのタインオアイ県にある例外的な円錐形帽子の村で、ベトナム人女性のエレガントな優雅さを象徴しています。',
          ko: '하노이 타인오아이현에 위치한 독특한 전통 논라 직조 마을로, 베트남 여성의 우아한 아름다움을 상징합니다.',
          zh: '位于河内青威的特色传统斗笠制作村，象征着越南女性的优雅之美。'
        },
        province: 'Ha Noi',
        location: {
          type: 'Point',
          coordinates: [105.7275, 20.8417]
        },
        categories: ['non la', 'dan lat'],
        images: [
          'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&w=800&q=80'
        ],
        isVerified: true,
        ownerId: adminUser._id
      },
      {
        slug: 'non-nuoc',
        name: {
          vi: 'Lang da my nghe Non Nuoc',
          en: 'Non Nuoc Stone Carving Village',
          ja: 'ノンヌオック石彫りの村',
          ko: '논누억 석조 공예 마을',
          zh: '五行山石雕村'
        },
        desc: {
          vi: 'Lang nghe dieu khac da my nghe ky vi nam duoi chan Ngu Hanh Son, Da Nang voi be day ky thuat tieu bieu.',
          en: 'Magnificent stone carving craft village under the Marble Mountains, Danang with spectacular techniques.',
          ja: 'ダナンの五行山の麓にある壮大な石彫り工芸の村で、見事な職人技術の歴史があります。',
          ko: '다낭 오행산 아래에 위치한 웅장한 대리석 조각 공예 마을로, 화려하고 입체적인 기술을 보존하고 있습니다.',
          zh: '位于岘港五行山脚下的雄伟石雕手艺村，拥有悠久的典型雕刻技术历史。'
        },
        province: 'Da Nang',
        location: {
          type: 'Point',
          coordinates: [108.2619, 16.0125]
        },
        categories: ['dieu khac da', 'my nghe'],
        images: [
          'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80'
        ],
        isVerified: true,
        ownerId: adminUser._id
      },
      {
        slug: 'quat-dong',
        name: {
          vi: 'Lang theu Quat Dong',
          en: 'Quat Dong Embroidery Village',
          ja: 'クアットドン刺繍村',
          ko: '꿧동 자수 마을',
          zh: '橘洞手绣村'
        },
        desc: {
          vi: 'Lang nghe theu ren truyen thong lau doi tai Thuong Tin, Ha Noi, noi luu giu nhung buc hoa bang chi theu tinh xao tuyet vi.',
          en: 'Long-standing traditional hand-embroidery craft village in Thuong Tin, Hanoi, creating stunning thread paintings.',
          ja: 'ハノイのトゥオンティン県にある長い歴史を持つ伝統的な手刺繍工芸村で、素晴らしい絵画的な刺繍作品を制作しています。',
          ko: '하노이 트엉띤현에 위치한 유서 깊은 전통 손자수 공예 마을로, 정교하고 수려한 실 자수 회화를 만듭니다.',
          zh: '位于河内常信的悠久传统手绣村，保留了用精美绣线绘制奇妙画卷的工艺。'
        },
        province: 'Ha Noi',
        location: {
          type: 'Point',
          coordinates: [105.8958, 20.8167]
        },
        categories: ['theu ren', 'thu cong'],
        images: [
          'https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&w=800&q=80'
        ],
        isVerified: true,
        ownerId: adminUser._id
      },
      {
        slug: 'ha-thai',
        name: {
          vi: 'Lang son mai Ha Thai',
          en: 'Ha Thai Lacquerware Village',
          ja: 'ハタイ漆器村',
          ko: '하타이 옻칠 공예 마을',
          zh: '下泰漆器村'
        },
        desc: {
          vi: 'Lang nghe tranh son mai va do my nghe cao cap tai Thuong Tin, Ha Noi dung hoa giua nghe thuat truyen thong va hien dai.',
          en: 'Elite lacquerware and fine arts craft village in Thuong Tin, Hanoi, harmonizing traditional and modern art.',
          ja: 'ハノイのトゥオンティン県にあるエリート漆器とファインアートの工芸村で、伝統芸術と現代美術を融合させています。',
          ko: '하노이 트엉띤현에 위치한 고급 옻칠 및 미적 미술 공예 마을로, 전통과 현대 미술의 조화를 이룹니다.',
          zh: '位于河内常信的高端漆画与美术工艺村，完美融合了传统艺术与现代艺术。'
        },
        province: 'Ha Noi',
        location: {
          type: 'Point',
          coordinates: [105.8817, 20.8950]
        },
        categories: ['son mai', 'my nghe'],
        images: [
          'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?auto=format&fit=crop&w=800&q=80'
        ],
        isVerified: true,
        ownerId: adminUser._id
      }
    ];

    await Village.insertMany(villagesData);
    console.log('Seeded 10 villages successfully.');

    // 4. Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed. Seeding process completed.');
  } catch (error) {
    console.error('Seeding process failed with error:', error);
    process.exit(1);
  }
};

// Start execution
seedDatabase().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
