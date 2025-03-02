
    let currency = '$';
    // 在文档加载时初始化
    document.addEventListener('DOMContentLoaded', initProductCards);

    // 监听Shopify的集合筛选完成事件（根据你的主题实际使用的事件）
    document.addEventListener('shopify:section:load', initProductCards);
    
    function initProductCards() {
      // 为每个产品卡片创建独立的作用域
      $('.card-wrapper').each(function() {
        const $card = $(this);
        // 从卡片元素获取变体数据
        const variantData = $card.data('variants');
        
        // 为每个卡片创建独立的状态对象
        const state = {
          currentOptions: {
            Metal: '',
            Clarity: ''
          }
        };

        // 初始化选项按钮事件（使用事件委托）
        $card.on('click', '.option-button[data-option="Metal"]', function() {
          const $btn = $(this);
          state.currentOptions.Metal = $btn.data('value');
          $btn.addClass('active').siblings().removeClass('active');
          updateCardInfo($card, state, variantData);
        });

        $card.on('click', '.option-button[data-option="Clarity"]', function() {
          const $btn = $(this);
          state.currentOptions.Clarity = $btn.data('value');
          $btn.addClass('active').siblings().removeClass('active');
          updateCardInfo($card, state, variantData);
        });

        // 初始化默认选项
        const defaultMetal = $card.find('.option-button[data-option="Metal"]:first').data('value');
        const defaultClarity = $card.find('.option-button[data-option="Clarity"]:first').data('value');
        state.currentOptions.Metal = defaultMetal;
        state.currentOptions.Clarity = defaultClarity;
        updateCardInfo($card, state, variantData);
      });
    }
    
    // 独立更新每个卡片的信息
    function updateCardInfo(cardElement, state, variants) {
      const selectedOptions = [
        state.currentOptions.Metal,
        state.currentOptions.Clarity
      ];

      // 查找匹配的变体（改进版）
      const matchedVariant = variants.find(v => {
        const optionValues = new Set(v.options);
        return (
          optionValues.has(selectedOptions[0]) && 
          optionValues.has(selectedOptions[1])
        );
      });

      if (matchedVariant) {
        // 更新当前卡片内容
        const $card = $(cardElement);
        $card.find('.card__media img').attr('src', matchedVariant.featured_image.src);
        if(matchedVariant.compare_at_price){
          $card.find('.price-item--regular').text(currency + (matchedVariant.compare_at_price / 100).toFixed(2));
        }
        $card.find('.price-item--sale').text(currency + (matchedVariant.price / 100).toFixed(2));
        
      }
    }
