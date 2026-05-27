/// <reference path="../../types/express.d.ts" />
import { Request, Response, NextFunction } from 'express';
import { getProductModel } from '../../models/tenant/Product.schema';
import { sendResponse } from '../../utils/response';
import { AppError } from '../../middleware/error.middleware';

/**
 * Get all products for the resolved tenant
 */
export const getProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const Product = getProductModel(req.tenantDb!);
    const products = await Product.find({}).sort({ createdAt: -1 });

    sendResponse(res, 200, true, products, `Successfully retrieved products for tenant '${req.tenant!.slug}'`);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new product for the resolved tenant
 */
export const createProduct = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const Product = getProductModel(req.tenantDb!);
    const { name, desc, price, stock, categoryTags, images } = req.body;

    if (!name || !name.vi || price === undefined) {
      return next(new AppError('Product name (vi) and price are required.', 400));
    }

    const newProduct = await Product.create({
      name,
      desc,
      price,
      stock: stock ?? 0,
      categoryTags: categoryTags ?? [],
      images: images ?? [],
      isPublished: true,
    });

    sendResponse(res, 210, true, newProduct, 'Product created successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Quick developer helper to seed demo products for the resolved tenant
 */
export const seedTenantProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const Product = getProductModel(req.tenantDb!);
    
    // Clear existing products
    await Product.deleteMany({});

    let productsToSeed = [];

    if (req.tenant!.slug === 'bat-trang') {
      productsToSeed = [
        {
          name: { vi: 'Bình hút lộc Gốm Chu Đậu', en: 'Chu Dau Ceramic Wealth Urn' },
          desc: { 
            vi: 'Bình hút tài lộc vẽ tay thủ công họa tiết hoa sen độc bản mang lại may mắn thịnh vượng.', 
            en: 'Hand-painted ceramic wealth urn featuring unique lotus patterns for prosperity.' 
          },
          price: 1200000,
          stock: 15,
          categoryTags: ['Gốm sứ', 'Bình phong thủy', 'Vẽ tay'],
          images: ['/images/products/bat-trang-binh-hut-loc.jpg'],
          isPublished: true,
        },
        {
          name: { vi: 'Bộ ấm trà Men Rạn Cổ', en: 'Crackle Glazed Antique Tea Set' },
          desc: { 
            vi: 'Bộ ấm chén men rạn bọc đồng tinh xảo mang đậm hồn cốt gốm cổ truyền Bát Tràng.', 
            en: 'Exquisite crackle-glazed tea set with bronze accents, rich in traditional Bat Trang heritage.' 
          },
          price: 850000,
          stock: 30,
          categoryTags: ['Gốm sứ', 'Ấm chén', 'Men rạn'],
          images: ['/images/products/bat-trang-bo-am-tra.jpg'],
          isPublished: true,
        }
      ];
    } else if (req.tenant!.slug === 'van-phuc') {
      productsToSeed = [
        {
          name: { vi: 'Khăn lụa Hà Đông thêu sen', en: 'Ha Dong Silk Scarf with Lotus Embroidery' },
          desc: { 
            vi: 'Khăn lụa tơ tằm tự nhiên 100% thêu tay sen độc bản mềm mại, sang trọng.', 
            en: '100% natural mulberry silk scarf hand-embroidered with lotus, soft and luxurious.' 
          },
          price: 450000,
          stock: 50,
          categoryTags: ['Lụa tơ tằm', 'Thời trang', 'Thêu tay'],
          images: ['/images/products/van-phuc-khan-lua.jpg'],
          isPublished: true,
        },
        {
          name: { vi: 'Áo dài lụa Vạn Phúc gấm hoa', en: 'Van Phuc Silk Ao Dai with Brocade Pattern' },
          desc: { 
            vi: 'Áo dài truyền thống may từ chất liệu lụa gấm Vạn Phúc cao cấp với hoa văn dệt chìm quý phái.', 
            en: 'Traditional Ao Dai tailored from premium Van Phuc brocade silk with elegant woven patterns.' 
          },
          price: 2500000,
          stock: 10,
          categoryTags: ['Lụa tơ tằm', 'Áo dài', 'Truyền thống'],
          images: ['/images/products/van-phuc-ao-dai.jpg'],
          isPublished: true,
        }
      ];
    } else {
      productsToSeed = [
        {
          name: { vi: 'Tượng Phật Di Lặc đá Non Nước', en: 'Maitreya Buddha Stone Statue' },
          desc: { 
            vi: 'Tượng Phật Di Lặc tạc từ đá cẩm thạch trắng tự nhiên nguyên khối, thần thái từ bi hỷ xả.', 
            en: 'Maitreya Buddha statue hand-carved from a single block of natural white marble.' 
          },
          price: 3500000,
          stock: 5,
          categoryTags: ['Đá mỹ nghệ', 'Tượng phong thủy', 'Cẩm thạch'],
          images: ['/images/products/non-nuoc-tuong-phat.jpg'],
          isPublished: true,
        }
      ];
    }

    const created = await Product.insertMany(productsToSeed);

    sendResponse(
      res,
      201,
      true,
      created,
      `Seeded ${created.length} demo products successfully for tenant '${req.tenant!.slug}'`
    );
  } catch (error) {
    next(error);
  }
};
