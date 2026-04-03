import Cart from "../model/Cart.js";
import Product from "../model/Product.js";

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user._id })
      .populate("items.productId", "name slug mainImage basePrice discountType discountValue");

    if (!cart) {
      cart = await Cart.create({ 
        userId: req.user._id,
        items: []
      });
    }

    res.status(200).json(cart);
  } catch (error) {
    console.error("Error in getCart:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/add
// @access  Private
export const addToCart = async (req, res) => {
  try {
    const { productId, size, color, quantity = 1 } = req.body;

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Find variant
    let variant = product.variants.find(v => 
      v.size === size && v.color === color
    );

    if (!variant) {
      return res.status(404).json({ message: "Product variant not found" });
    }

    // Check stock
    if (variant.stock < quantity) {
      return res.status(400).json({ 
        message: `Only ${variant.stock} items available in stock` 
      });
    }

    // Get or create cart
    let cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [] });
    }

    // Check if item already in cart
    const existingItemIndex = cart.items.findIndex(item => 
      item.productId.toString() === productId &&
      item.size === size &&
      item.color === color
    );

    const price = variant.discountedPrice || variant.price;

    if (existingItemIndex > -1) {
      // Update existing item
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      if (variant.stock < newQuantity) {
        return res.status(400).json({ 
          message: `Only ${variant.stock} items available in stock` 
        });
      }
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item
      cart.items.push({
        productId,
        name: product.name,
        size: size,
        color: color,
        price: variant.price,
        discountedPrice: variant.discountedPrice,
        quantity,
        image: variant.images?.[0] || product.mainImage,
        addedAt: new Date()
      });
    }

    await cart.save();
    
    // Populate product details
    await cart.populate("items.productId", "name slug mainImage basePrice discountType discountValue");

    res.status(200).json(cart);
  } catch (error) {
    console.error("Error in addToCart:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/update/:itemId
// @access  Private
export const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const { itemId } = req.params;

    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found in cart" });
    }

    // Check stock
    const product = await Product.findById(item.productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    
    const variant = product.variants.find(v => 
      v.size === item.size && v.color === item.color
    );

    if (!variant || variant.stock < quantity) {
      return res.status(400).json({ 
        message: `Only ${variant?.stock || 0} items available in stock` 
      });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or negative
      item.deleteOne();
    } else {
      item.quantity = quantity;
    }

    await cart.save();
    await cart.populate("items.productId", "name slug mainImage basePrice discountType discountValue");

    res.status(200).json(cart);
  } catch (error) {
    console.error("Error in updateCartItem:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/remove/:itemId
// @access  Private
// export const removeFromCart = async (req, res) => {
//   try {
//     const cart = await Cart.findOne({ userId: req.user._id });

//     if (!cart) {
//       return res.status(404).json({ message: "Cart not found" });
//     }

//     cart.items = cart.items.filter(
//       item => item._id.toString() !== req.params.itemId
//     );

//     await cart.save();
//     await cart.populate("items.productId", "name slug mainImage basePrice discountType discountValue");

//     res.status(200).json(cart);
//   } catch (error) {
//     console.error("Error in removeFromCart:", error);
//     res.status(500).json({ message: error.message });
//   }
// };
// In cartController.js
// export const removeFromCart = async (req, res) => {
//   try {
//     const { productId, size, color } = req.body; // Get from body
//     const { itemId } = req.params; // Or from params

//     const cart = await Cart.findOne({ userId: req.user._id });

//     if (!cart) {
//       return res.status(404).json({ message: "Cart not found" });
//     }

//     // Remove by itemId OR by productId/size/color
//     if (itemId) {
//       // Remove by cart item ID
//       cart.items = cart.items.filter(
//         item => item._id.toString() !== itemId
//       );
//     } else if (productId && size && color) {
//       // Remove by product details
//       cart.items = cart.items.filter(
//         item => 
//           item.productId.toString() !== productId ||
//           item.size !== size ||
//           item.color !== color
//       );
//     } else {
//       return res.status(400).json({ message: "Invalid removal parameters" });
//     }

//     await cart.save();
//     await cart.populate("items.productId", "name slug mainImage basePrice discountType discountValue");

//     res.status(200).json(cart);
//   } catch (error) {
//     console.error("Error in removeFromCart:", error);
//     res.status(500).json({ message: error.message });
//   }
// };
// Replace your removeFromCart controller with this simpler version
export const removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    const cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // Remove by cart item ID
    cart.items = cart.items.filter(
      item => item._id.toString() !== itemId
    );

    await cart.save();
    await cart.populate("items.productId", "name slug mainImage basePrice discountType discountValue");

    res.status(200).json(cart);
  } catch (error) {
    console.error("Error in removeFromCart:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart/clear
// @access  Private
export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });

    if (cart) {
      cart.items = [];
      cart.couponCode = null;
      cart.couponDiscount = 0;
      await cart.save();
    }

    res.status(200).json({ message: "Cart cleared successfully", cart });
  } catch (error) {
    console.error("Error in clearCart:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Apply coupon to cart
// @route   POST /api/cart/apply-coupon
// @access  Private
export const applyCoupon = async (req, res) => {
  try {
    const { couponCode } = req.body;

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Find coupon (you need to create a Coupon model)
    // This is a placeholder - implement your coupon logic
    let discount = 0;
    
    // Example coupon logic:
    if (couponCode === "SAVE10") {
      discount = cart.subtotal * 0.1;
    }

    cart.couponCode = couponCode;
    cart.couponDiscount = discount;
    await cart.save();

    res.status(200).json({
      message: "Coupon applied successfully",
      discount,
      couponCode,
      cart
    });
  } catch (error) {
    console.error("Error in applyCoupon:", error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove coupon from cart
// @route   DELETE /api/cart/remove-coupon
// @access  Private
export const removeCoupon = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });

    if (cart) {
      cart.couponCode = null;
      cart.couponDiscount = 0;
      await cart.save();
    }

    res.status(200).json({ message: "Coupon removed successfully", cart });
  } catch (error) {
    console.error("Error in removeCoupon:", error);
    res.status(500).json({ message: error.message });
  }
};