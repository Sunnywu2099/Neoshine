(function() {
  const SELECTORS = {
    productGrid: '#product-grid',
    cardWrapper: '.card-wrapper',
    optionButton: '[data-option]',
    mediaImage: '.card__media img',
    regularPrice: '.price-item--regular',
    salePrice: '.price-item--sale'
  };

  class ProductCardManager {
    constructor() {
      if (ProductCardManager.instance) return ProductCardManager.instance;
      
      this.initialized = new WeakSet();
      this.updateLock = false;
      this.initObservers();
      this.initEventDelegation();
      ProductCardManager.instance = this;
    }

    initObservers() {
      // 优化后的MutationObserver
      this.observer = new MutationObserver(mutations => {
        if (this.updateLock) return;
        
        mutations.forEach(mutation => {
          if ([...mutation.addedNodes].some(n => n.matches?.(SELECTORS.cardWrapper))) {
            this.safeInitialize();
          }
        });
      });

      const grid = document.querySelector(SELECTORS.productGrid);
      if (grid) this.observer.observe(grid, { childList: true, subtree: true });
    }

    initEventDelegation() {
      // 使用一次性事件委托
      $(document).off('click.productCards').on('click.productCards', SELECTORS.optionButton, e => {
        const $btn = $(e.target);
        if ($btn.hasClass('active')) return;

        this.updateLock = true;
        try {
          const $card = $btn.closest(SELECTORS.cardWrapper);
          this.handleOptionChange($card, $btn);
        } finally {
          this.updateLock = false;
        }
      });
    }

    safeInitialize() {
      requestAnimationFrame(() => {
        $(SELECTORS.cardWrapper).each((i, card) => {
          if (this.initialized.has(card)) return;
          
          this.initializeCard($(card));
          this.initialized.add(card);
        });
      });
    }

    initializeCard($card) {
      const state = {
        metal: $card.find(`${SELECTORS.optionButton}[data-option="Metal"]:first`).data('value'),
        clarity: $card.find(`${SELECTORS.optionButton}[data-option="Clarity"]:first`).data('value')
      };
      
      $card.data('productState', state);
      this.refreshCard($card);
    }

    handleOptionChange($card, $btn) {
      const optionType = $btn.data('option');
      const value = $btn.data('value');
      const state = $card.data('productState');

      // 更新状态
      state[optionType.toLowerCase()] = value;
      $btn.addClass('active').siblings().removeClass('active');
      
      this.refreshCard($card);
    }

    refreshCard($card) {
      const variants = $card.data('variants');
      const state = $card.data('productState');
      
      const variant = this.findVariant(variants, state);
      if (!variant) return;

      this.updateMedia($card, variant);
      this.updatePrices($card, variant);
    }

    findVariant(variants, state) {
      return variants.find(v => 
        v.options.includes(state.metal) && 
        v.options.includes(state.clarity)
      );
    }

    updateMedia($card, variant) {
      const $img = $card.find(SELECTORS.mediaImage);
      const newSrc = variant.featured_image?.src;
      
      if (newSrc && $img.attr('src') !== newSrc) {
        $img.attr('src', newSrc);
      }
    }

    updatePrices($card, variant) {
      const $regular = $card.find(SELECTORS.regularPrice);
      const $sale = $card.find(SELECTORS.salePrice);
      
      // 缓存当前价格值
      const currentRegular = $regular.text();
      const currentSale = $sale.text();
      
      // 格式化价格
      const formatPrice = (price) => '$' + (price / 100).toFixed(2);
      const newRegular = format(variant.compare_at_price);
      const newSale = format(variant.price);

      // 只在价格变化时更新DOM
      if (variant.compare_at_price) {
        if (currentRegular !== newRegular) $regular.html(newRegular);
        if (currentSale !== newSale) $sale.html(newSale);
        $regular.show();
      } else {
        if (currentSale !== newSale) $sale.html(newSale);
        $regular.hide();
      }
    }
  }

  // 初始化
  document.addEventListener('DOMContentLoaded', () => {
    new ProductCardManager();
    setTimeout(() => $(SELECTORS.cardWrapper).each((i, c) => new ProductCardManager().initialized.add(c)), 500);
  });


})();