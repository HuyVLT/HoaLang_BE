import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { User } from '../models/core/User.model';
import { Tenant } from '../models/core/Tenant.model';
import { PageConfig } from '../models/core/PageConfig.model';
import { UserTenantRole } from '../models/core/UserTenantRole.model';
import { Village } from '../models/Village.model';
import { connectCoreDB } from '../config/coreDatabase';
import { getTenantConnection } from '../config/tenantConnection';
import { getTenantModels } from '../modules/shared/modelFactory/modelFactory';
import { provisioningService } from '../modules/tenantProvisioning/provisioning.service';

dotenv.config();

const TENANTS_TO_SEED = [
  {
    slug: 'bat-trang',
    name: 'Làng Gốm Bát Tràng',
    domain: 'battrang.hoalang.site',
    features: { ecommerce: true, booking: true, aiAssistant: true },
    theme: { primaryColor: '#8B5A2B', logo: '/logos/bat-trang.svg' },
  },
  {
    slug: 'van-phuc',
    name: 'Làng Lụa Vạn Phúc',
    domain: 'vanphuc.hoalang.site',
    features: { ecommerce: true, booking: true, aiAssistant: false },
    theme: { primaryColor: '#8B1A1A', logo: '/logos/van-phuc.svg' },
  },
  {
    slug: 'non-nuoc',
    name: 'Làng Đá Mỹ Nghệ Non Nước',
    domain: 'nonnuoc.hoalang.site',
    features: { ecommerce: true, booking: false, aiAssistant: false },
    theme: { primaryColor: '#4A5568', logo: '/logos/non-nuoc.svg' },
  },
];

const seedDatabase = async (): Promise<void> => {
  console.log('═══════════════════════════════════════════════════');
  console.log('  HoaLang — Complete Multi-Tenant Seeder');
  console.log('═══════════════════════════════════════════════════\n');

  try {
    console.log('Connecting to core database...');
    await connectCoreDB();
    console.log('Core database connected successfully.');

    // 1. Clean existing records in Core database
    console.log('Clearing existing core collections...');
    await User.deleteMany({});
    await Tenant.deleteMany({});
    await PageConfig.deleteMany({});
    await UserTenantRole.deleteMany({});
    await Village.deleteMany({});
    console.log('Core collections cleared.');

    // 1.5. Clean existing tenant databases to avoid duplicate key errors during provisioning
    console.log('Clearing existing tenant databases...');
    const tenantDbNames = ['tenant_battrang', 'tenant_vanphuc', 'tenant_nonnuoc'];
    for (const dbName of tenantDbNames) {
      try {
        const conn = await getTenantConnection(dbName);
        const models = getTenantModels(conn);
        await models.CmsPage.deleteMany({});
        await models.Product.deleteMany({});
        await models.Workshop.deleteMany({});
        await models.Booking.deleteMany({});
        await models.Order.deleteMany({});
        await models.Experience.deleteMany({});
        await models.Media.deleteMany({});
        await models.Review.deleteMany({});
        await conn.close();
        console.log(`  ✓ Cleared database ${dbName}`);
      } catch (err) {
        console.log(`  ⚠ Could not clear ${dbName} (might not exist yet):`, err instanceof Error ? err.message : err);
      }
    }
    console.log('Tenant databases cleared.');

    // 2. Generate hashed passwords
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('Admin@123', salt);
    const ownerPassword = await bcrypt.hash('TruongHuy888!', salt);
    const userPassword = await bcrypt.hash('TruongHuy888!', salt);

    // 3. Create Admin account
    console.log('Creating Admin account...');
    await User.create({
      email: 'admin@hoalang.vn',
      fullName: 'Super Admin',
      password: adminPassword,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      role: 'ADMIN',
      locale: 'vi'
    });
    console.log('Admin account created successfully: admin@hoalang.vn');

    // 4. Create Village Owners
    console.log('Creating Village Owner accounts...');
    const battrangOwner: any = await User.create({
      email: 'owner@battrang.vn',
      fullName: 'Chủ Làng Bát Tràng',
      password: ownerPassword,
      role: 'VILLAGE_OWNER',
      locale: 'vi'
    });
    const vanphucOwner: any = await User.create({
      email: 'owner@vanphuc.vn',
      fullName: 'Chủ Làng Vạn Phúc',
      password: ownerPassword,
      role: 'VILLAGE_OWNER',
      locale: 'vi'
    });
    const nonnuocOwner: any = await User.create({
      email: 'owner@nonuoc.vn',
      fullName: 'Chủ Làng Non Nước',
      password: ownerPassword,
      role: 'VILLAGE_OWNER',
      locale: 'vi'
    });
    console.log('Village Owner accounts created successfully.');

    // 5. Create Demo User
    console.log('Creating Demo traveler account...');
    await User.create({
      email: 'traveler@gmail.com',
      fullName: 'Du Khách Đam Mê Di Sản',
      password: userPassword,
      role: 'USER',
      locale: 'vi'
    });
    console.log('Demo Traveler account created successfully: traveler@gmail.com');

    // 6. Seed Tenants & Tenant Databases via Provisioning Service
    console.log('Provisioning tenants...');
    const btProvision = await provisioningService.createTenant(TENANTS_TO_SEED[0]);
    const vpProvision = await provisioningService.createTenant(TENANTS_TO_SEED[1]);
    const nnProvision = await provisioningService.createTenant(TENANTS_TO_SEED[2]);
    console.log('Tenants provisioned successfully.');

    // 7. Map Owner Roles in UserTenantRole
    console.log('Mapping owner-tenant relations in UserTenantRole...');
    await UserTenantRole.create([
      { userId: battrangOwner._id, tenantId: btProvision.tenant._id, role: 'OWNER' },
      { userId: vanphucOwner._id, tenantId: vpProvision.tenant._id, role: 'OWNER' },
      { userId: nonnuocOwner._id, tenantId: nnProvision.tenant._id, role: 'OWNER' }
    ]);
    console.log('Relations mapped successfully.');

    // 8. Create Village lists in hoalang_core for homepage rendering
    console.log('Seeding core villages list...');
    await Village.create([
      {
        slug: 'bat-trang',
        name: {
          vi: 'Làng Gốm Bát Tràng',
          en: 'Bat Trang Pottery Village',
          ja: 'バッチャン陶芸村',
          ko: '밧짱 도자기 마을'
        },
        desc: {
          vi: 'Làng gốm Bát Tràng nằm bên bờ sông Hồng, cách trung tâm Hà Nội 13km về phía Đông Nam. Với hơn 700 năm lịch sử, nơi đây là cái nôi của nghề gốm sứ Việt Nam — nơi những đôi bàn tay tài hoa của hàng nghìn nghệ nhân đã tạo nên những tác phẩm vừa mang giá trị sử dụng, vừa là di sản văn hóa trường tồn.',
          en: 'Bat Trang Pottery Village sits along the Red River banks, 13km southeast of Hanoi. With over 700 years of history, it is the cradle of Vietnamese ceramic arts — where thousands of artisans craft works that blend utilitarian beauty with enduring cultural heritage.'
        },
        province: 'Hà Nội',
        location: {
          type: 'Point',
          coordinates: [105.9025, 20.9934]
        },
        categories: ['Gốm sứ', 'Đồ gia dụng', 'Nghệ thuật trang trí'],
        images: [
          'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80'
        ],
        isVerified: true,
        ownerId: battrangOwner._id
      },
      {
        slug: 'van-phuc',
        name: {
          vi: 'Làng Lụa Vạn Phúc',
          en: 'Van Phuc Silk Village'
        },
        desc: {
          vi: 'Làng lụa Vạn Phúc thuộc quận Hà Đông, nổi tiếng với những tấm lụa tơ tằm mềm mại, bền màu và họa tiết hoa văn tinh xảo. Lụa Vạn Phúc từng được tiến vua và hiện là thương hiệu dệt thủ công nổi tiếng nhất Việt Nam.',
          en: 'Van Phuc Silk Village sits in Ha Dong district, famous for soft natural silk sheets, durable colors, and sophisticated traditional weaving patterns.'
        },
        province: 'Hà Nội (Hà Đông)',
        location: {
          type: 'Point',
          coordinates: [105.7731, 20.9689]
        },
        categories: ['Dệt lụa', 'Thời trang', 'Thổ cẩm'],
        images: [
          'https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&w=800&q=80'
        ],
        isVerified: true,
        ownerId: vanphucOwner._id
      },
      {
        slug: 'non-nuoc',
        name: {
          vi: 'Làng Đá Mỹ Nghệ Non Nước',
          en: 'Non Nuoc Stone Carving Village'
        },
        desc: {
          vi: 'Nằm dưới chân núi Ngũ Hành Sơn huyền bí, làng nghề Non Nước là nơi những khối đá cẩm thạch trắng được bàn tay nghệ nhân thổi hồn thành tượng, phù điêu và đồ trang trí tinh xảo. Tiếng đục đẽo vang vọng đã trở thành âm thanh đặc trưng của vùng đất này.',
          en: 'Nestled at the foot of Marble Mountains, Non Nuoc Stone Village is where white marble blocks are turned into fine statues, bas-reliefs, and exquisite crafts.'
        },
        province: 'Đà Nẵng',
        location: {
          type: 'Point',
          coordinates: [108.2648, 16.0217]
        },
        categories: ['Đá mỹ nghệ', 'Điêu khắc', 'Lưu niệm'],
        images: [
          'https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80'
        ],
        isVerified: true,
        ownerId: nonnuocOwner._id
      }
    ]);
    console.log('Core villages seeded.');

    // 9. Seed products & workshops to Tenant-specific Databases
    console.log('\nSeeding products & workshops inside tenant databases...');

    // ────────────── TENANT 1: Bát Tràng ──────────────
    const btConn = await getTenantConnection(btProvision.dbName);
    const btModels = getTenantModels(btConn);
    
    await btModels.Product.deleteMany({});
    await btModels.Workshop.deleteMany({});

    const btProducts = [
      {
        name: { vi: 'Bình Hoa Men Ngọc', en: 'Jade Glazed Vase' },
        desc: {
          vi: 'Bình hoa men ngọc cao 28cm, dáng truyền thống được nung ở nhiệt độ 1280°C. Màu xanh ngọc đặc trưng của Bát Tràng, viền họa tiết sen tinh xảo.',
          en: 'Jade glazed vase 28cm tall, wood-fired at 1280°C with traditional lotus pattern.'
        },
        price: 480000,
        images: ['https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80'],
        stock: 25,
        categoryTags: ['Gốm sứ', 'Nghệ thuật trang trí'],
        isPublished: true
      },
      {
        name: { vi: 'Bộ Ấm Trà Coban', en: 'Cobalt Blue Tea Set' },
        desc: {
          vi: 'Bộ ấm trà 6 món men coban xanh đậm. Họa tiết rồng phượng truyền thống vẽ tay bởi nghệ nhân Nguyễn Văn Thành — 40 năm kinh nghiệm.',
          en: 'Exquisite cobalt blue tea set of 6 cups and 1 teapot, hand-painted by grandmaster artisan.'
        },
        price: 850000,
        images: ['https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80'],
        stock: 15,
        categoryTags: ['Bộ ấm trà', 'Gốm sứ'],
        isPublished: true
      },
      {
        name: { vi: 'Chén Uống Trà', en: 'Hand-painted Tea Bowl' },
        desc: {
          vi: 'Chén uống trà vẽ tay họa tiết truyền thống.',
          en: 'Hand-painted tea bowl with classic designs.'
        },
        price: 120000,
        images: ['https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80'],
        stock: 80,
        categoryTags: ['Chén trà', 'Gốm sứ'],
        isPublished: true
      },
      {
        name: { vi: 'Lọ Cắm Hoa Mini', en: 'Mini Bud Vase Set' },
        desc: {
          vi: 'Bộ lọ cắm hoa mini xinh xắn.',
          en: 'Cute mini bud vase set.'
        },
        price: 220000,
        images: ['https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=800&q=80'],
        stock: 50,
        categoryTags: ['Trang trí', 'Gốm sứ'],
        isPublished: true
      },
      {
        name: { vi: 'Tượng Rồng Phong Thủy', en: 'Feng Shui Dragon' },
        desc: {
          vi: 'Tượng rồng phong thủy gốm sứ tinh xảo.',
          en: 'Exquisite ceramic feng shui dragon statue.'
        },
        price: 1200000,
        images: ['https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80'],
        stock: 8,
        categoryTags: ['Phong thủy', 'Nghệ thuật trang trí'],
        isPublished: true
      }
    ];

    const btWorkshops = [
      {
        title: { vi: 'Nặn Gốm Trên Bàn Xoay', en: 'Wheel Throwing Basics' },
        desc: {
          vi: 'Trải nghiệm cảm giác đất sét định hình dưới tay bạn trên bàn xoay truyền thống. Nghệ nhân hướng dẫn từng bước — bạn sẽ mang về tác phẩm gốm của chính mình sau khi nung.',
          en: 'Experience clay forming on wooden wheel guided by artisans, wood-fired afterward.'
        },
        instructor: 'Nghệ nhân Nguyễn Văn Thành',
        duration: 120,
        maxParticipants: 8,
        price: 350000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isPublished: true,
        tags: ['Gốm sứ', 'Xoay gốm']
      },
      {
        title: { vi: 'Vẽ Hoa Văn Coban', en: 'Cobalt Painting Workshop' },
        desc: {
          vi: 'Học cách vẽ họa tiết coban truyền thống trên gốm.',
          en: 'Learn traditional cobalt blue painting techniques on ceramic bodies.'
        },
        instructor: 'Nghệ nhân Phạm Thị Liên',
        duration: 90,
        maxParticipants: 12,
        price: 280000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isPublished: true,
        tags: ['Vẽ gốm', 'Coban']
      },
      {
        title: { vi: 'Tour Tham Quan Lò Nung', en: 'Kiln Tour' },
        desc: {
          vi: 'Tham quan lò bầu cổ và lò gas nung gốm.',
          en: 'Tour ancient multi-chamber wood kilns and modern gas systems.'
        },
        instructor: 'Nghệ nhân Nguyễn Văn Thành',
        duration: 60,
        maxParticipants: 20,
        price: 150000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isPublished: true,
        tags: ['Tham quan', 'Lò bầu']
      }
    ];

    await btModels.Product.create(btProducts);
    await btModels.Workshop.create(btWorkshops);
    console.log('  ✓ Seeded products and workshops for bat-trang.');


    // ────────────── TENANT 2: Vạn Phúc ──────────────
    const vpConn = await getTenantConnection(vpProvision.dbName);
    const vpModels = getTenantModels(vpConn);

    await vpModels.Product.deleteMany({});
    await vpModels.Workshop.deleteMany({});

    const vpProducts = [
      {
        name: { vi: 'Khăn Lụa Tơ Tằm', en: 'Mulberry Silk Scarf' },
        desc: {
          vi: 'Khăn lụa tơ tằm dệt tay mềm mại.',
          en: 'Soft handwoven mulberry silk scarf.'
        },
        price: 320000,
        images: ['https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&w=800&q=80'],
        stock: 60,
        categoryTags: ['Khăn lụa', 'Tơ tằm'],
        isPublished: true
      },
      {
        name: { vi: 'Áo Dài Lụa Vạn Phúc', en: 'Van Phuc Silk Ao Dai' },
        desc: {
          vi: 'Áo dài truyền thống may từ lụa Vân Vạn Phúc.',
          en: 'Traditional Ao Dai made of elite Van silk.'
        },
        price: 2800000,
        images: ['https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&w=800&q=80'],
        stock: 12,
        categoryTags: ['Áo dài', 'Lụa Vân'],
        isPublished: true
      },
      {
        name: { vi: 'Túi Lụa Thêu Tay', en: 'Hand-embordered Silk Bag' },
        desc: {
          vi: 'Túi lụa sang trọng thêu tay tinh xảo.',
          en: 'Luxurious silk handbag decorated with fine hand-embroidery.'
        },
        price: 650000,
        images: ['https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&w=800&q=80'],
        stock: 30,
        categoryTags: ['Túi lụa', 'Thêu tay'],
        isPublished: true
      },
      {
        name: { vi: 'Đồng Hồ Bọc Lụa (Quà tặng)', en: 'Silk-wrapped Clock (Gift)' },
        desc: {
          vi: 'Đồng hồ treo tường bọc lụa Vân làm quà lưu niệm.',
          en: 'Fine souvenir wall clock decorated in elite Van silk.'
        },
        price: 450000,
        images: ['https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&w=800&q=80'],
        stock: 20,
        categoryTags: ['Quà tặng', 'Lụa Vân'],
        isPublished: true
      }
    ];

    const vpWorkshops = [
      {
        title: { vi: 'Dệt Lụa Tay Truyền Thống', en: 'Traditional Handloom Weaving' },
        desc: {
          vi: 'Trải nghiệm dệt lụa tơ tằm trên khung cửi truyền thống.',
          en: 'Try dệt lụa on ancient wooden handlooms.'
        },
        instructor: 'Nghệ nhân Triệu Văn Mão',
        duration: 180,
        maxParticipants: 5,
        price: 420000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isPublished: true,
        tags: ['Dệt lụa', 'Khung cửi']
      },
      {
        title: { vi: 'Thiết Kế Khăn Lụa Cá Nhân', en: 'Custom Silk Scarf Design' },
        desc: {
          vi: 'Tự tay nhuộm màu và thiết kế họa tiết cho khăn lụa của riêng bạn.',
          en: 'Learn tie-dye and organic silk painting.'
        },
        instructor: 'Nghệ nhân Nguyễn Thị Hoa',
        duration: 120,
        maxParticipants: 10,
        price: 350000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isPublished: true,
        tags: ['Nhuộm lụa', 'Thiết kế']
      }
    ];

    await vpModels.Product.create(vpProducts);
    await vpModels.Workshop.create(vpWorkshops);
    console.log('  ✓ Seeded products and workshops for van-phuc.');


    // ────────────── TENANT 3: Non Nước ──────────────
    const nnConn = await getTenantConnection(nnProvision.dbName);
    const nnModels = getTenantModels(nnConn);

    await nnModels.Product.deleteMany({});
    await nnModels.Workshop.deleteMany({});

    const nnProducts = [
      {
        name: { vi: 'Tượng Phật Đá Cẩm Thạch', en: 'Marble Buddha Statue' },
        desc: {
          vi: 'Tượng Phật bằng đá cẩm thạch trắng tự nhiên điêu khắc tay tinh xảo.',
          en: 'Exquisite hand-carved white marble Buddha statue.'
        },
        price: 3500000,
        images: ['https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80'],
        stock: 5,
        categoryTags: ['Tượng đá', 'Cẩm thạch'],
        isPublished: true
      },
      {
        name: { vi: 'Bộ Cờ Đá Cẩm Thạch', en: 'Marble Chess Set' },
        desc: {
          vi: 'Bộ cờ vua/cờ tướng bằng đá cẩm thạch sang trọng.',
          en: 'Luxurious hand-polished marble chess set.'
        },
        price: 1800000,
        images: ['https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80'],
        stock: 8,
        categoryTags: ['Bộ cờ', 'Đá cẩm thạch'],
        isPublished: true
      },
      {
        name: { vi: 'Hòn Non Bộ Mini', en: 'Mini Marble Mountain Landscape' },
        desc: {
          vi: 'Hòn non bộ mini trang trí bàn làm việc.',
          en: 'Desk miniature of stone landscapes.'
        },
        price: 650000,
        images: ['https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80'],
        stock: 20,
        categoryTags: ['Hòn non bộ', 'Trang trí'],
        isPublished: true
      },
      {
        name: { vi: 'Vòng Tay Đá Tự Nhiên', en: 'Natural Stone Bracelet' },
        desc: {
          vi: 'Vòng tay đá phong thủy tự nhiên.',
          en: 'Natural feng shui stone bracelet.'
        },
        price: 280000,
        images: ['https://images.unsplash.com/photo-1610701596007-11502861dcfa?auto=format&fit=crop&w=800&q=80'],
        stock: 45,
        categoryTags: ['Vòng tay', 'Phong thủy'],
        isPublished: true
      }
    ];

    const nnWorkshops = [
      {
        title: { vi: 'Khắc Đá Cơ Bản', en: 'Intro to Stone Carving' },
        desc: {
          vi: 'Học cách sử dụng búa, đục để khắc họa tiết đơn giản trên đá cẩm thạch.',
          en: 'Learn to handle specialized chisels and hammers on stone blocks.'
        },
        instructor: 'Nghệ nhân Huỳnh Văn Liên',
        duration: 150,
        maxParticipants: 6,
        price: 500000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isPublished: true,
        tags: ['Khắc đá', 'Đá cẩm thạch']
      },
      {
        title: { vi: 'Tạo Tượng Đá Mini', en: 'Mini Stone Statue Sculpting' },
        desc: {
          vi: 'Tạc một bức tượng đá nhỏ mang về làm kỷ niệm.',
          en: 'Sculpt a miniature stone animal guided by veterans.'
        },
        instructor: 'Nghệ nhân Huỳnh Văn Liên',
        duration: 240,
        maxParticipants: 4,
        price: 800000,
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        isPublished: true,
        tags: ['Điêu khắc', 'Tạc tượng']
      }
    ];

    await nnModels.Product.create(nnProducts);
    await nnModels.Workshop.create(nnWorkshops);
    console.log('  ✓ Seeded products and workshops for non-nuoc.');

    // 10. Close all connections gracefully
    console.log('\nClosing all connections...');
    await btConn.close();
    await vpConn.close();
    await nnConn.close();
    await mongoose.connection.close();
    console.log('Database connections closed.');

    console.log('\n═══════════════════════════════════════════════════');
    console.log('  ✅ Admin account: admin@hoalang.vn');
    console.log('  ✅ 3 tenants: bat-trang | van-phuc | non-nuoc');
    console.log(`  ✅ Tổng sản phẩm: ${btProducts.length + vpProducts.length + nnProducts.length} | Workshop: ${btWorkshops.length + vpWorkshops.length + nnWorkshops.length}`);
    console.log('  ✅ Demo user: traveler@gmail.com');
    console.log('═══════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('Seeding process failed with fatal error:', error);
    process.exit(1);
  }
};

// Start execution
seedDatabase().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
