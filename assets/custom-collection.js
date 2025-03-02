(function() { // 使用 IIFE 避免全局污染
  // 配置参数
  const SELECTORS = {
    productGrid: '#product-grid', // 产品列表容器
    cardWrapper: '.card-wrapper', // 单个产品卡片
    optionButton: '[data-option]', // 选项按钮
    mediaImage: '.card__media img', // 主图
    regularPrice: '.price-item--regular', // 原价
    salePrice: '.price-item--sale' // 售价
  };

  // 核心控制器
  class ProductCardManager {
    constructor() {
      this.observer = null;
      this.initEventListeners();
      this.initMutationObserver();
      this.initializeAllCards();
    }

    // 初始化事件监听 (事件委托)
    initEventListeners() {
      $(document).on('click', SELECTORS.optionButton, (e) => {
        const $btn = $(e.currentTarget);
        const $card = $btn.closest(SELECTORS.cardWrapper);
        if ($btn.hasClass('active')) return; // 防止重复点击
        
        this.handleOptionClick($card, $btn);
      });
    }

    // 初始化 MutationObserver
    initMutationObserver() {
      this.observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            this.handleProductGridUpdate();
          }
        });
      });

      const gridElement = document.querySelector(SELECTORS.productGrid);
      if (gridElement) {
        this.observer.observe(gridElement, {
          childList: true, // 监听子元素变化
          subtree: true    // 监听所有后代元素
        });
      }
    }

    // 处理产品列表更新
    handleProductGridUpdate() {
      // 延迟确保 DOM 完全渲染
      setTimeout(() => {
        this.initializeAllCards();
        this.refreshAllCards();
      }, 100);
    }

    // 初始化所有卡片
    initializeAllCards() {
      $(SELECTORS.cardWrapper).each((i, card) => {
        const $card = $(card);
        if (!$card.data('initialized')) {
          this.setupCardState($card);
          $card.data('initialized', true);
        }
      });
    }

    // 设置卡片初始状态
    setupCardState($card) {
      const variantData = $card.data('variants');
      if (!variantData) return;

      // 设置默认选项
      ['Metal', 'Clarity'].forEach(optionType => {
        const $firstBtn = $card.find(`${SELECTORS.optionButton}[data-option="${optionType}"]:first`);
        $firstBtn.addClass('active');
        $card.data(optionType.toLowerCase(), $firstBtn.data('value'));
      });

      // 初始更新
      this.updateCardInfo($card);
    }

    // 处理选项点击
    handleOptionClick($card, $btn) {
      const optionType = $btn.data('option');
      const value = $btn.data('value');

      // 更新状态
      $card.data(optionType.toLowerCase(), value);
      $btn.addClass('active')
          .siblings(SELECTORS.optionButton)
          .removeClass('active');

      // 更新卡片信息
      this.updateCardInfo($card);
    }

    // 更新卡片信息
    updateCardInfo($card) {
      const variantData = $card.data('variants');
      const currentMetal = $card.data('metal');
      const currentClarity = $card.data('clarity');

      const matchedVariant = variantData.find(v => 
        v.options.includes(currentMetal) && 
        v.options.includes(currentClarity)
      );

      if (matchedVariant) {
        this.updateMedia($card, matchedVariant);
        this.updatePrices($card, matchedVariant);
      }
    }

    // 更新图片
    updateMedia($card, variant) {
      const $img = $card.find(SELECTORS.mediaImage);
      const newSrc = variant.featured_image?.src;
      
      if (newSrc && $img.attr('src') !== newSrc) {
        $img.attr('src', newSrc)
            .attr('srcset', '') // 清除响应式图片
            .removeAttr('loading'); // 确保立即加载
      }
    }

    // 更新价格
    updatePrices($card, variant) {
      const $regular = $card.find(SELECTORS.regularPrice);
      const $sale = $card.find(SELECTORS.salePrice);
      
      // 使用 Shopify 标准货币格式
      const formatPrice = (price) => Shopify.formatMoney(price, {{ shop.money_format | json }});

      if (variant.compare_at_price > variant.price) {
        $regular.show().html(formatPrice(variant.compare_at_price));
        $sale.show().html(formatPrice(variant.price));
      } else {
        $regular.hide();
        $sale.html(formatPrice(variant.price));
      }
    }

    // 刷新所有卡片
    refreshAllCards() {
      $(SELECTORS.cardWrapper).each((i, card) => {
        this.updateCardInfo($(card));
      });
    }
  }

  // 初始化逻辑
  document.addEventListener('DOMContentLoaded', () => {
    // 首次加载初始化
    new ProductCardManager();
    
    // Shopify Turbo 兼容（如果使用）
    if (typeof Turbo !== 'undefined') {
      document.addEventListener('turbo:load', () => {
        new ProductCardManager();
      });
    }
  });

  // Shopify 主题事件兼容
  if (typeof Shopify === 'object') {
    document.addEventListener('shopify:section:load', (event) => {
      if (event.target.querySelector(SELECTORS.productGrid)) {
        new ProductCardManager();
      }
    });
  }
})();