import $ from 'jquery';
import _ from 'underscore';
import util from 'util';
import templ from './Common';
import View from 'views/View';
import Popup from 'views/Popup';
import Product from 'game/Product';

function newDiscovery(data) {
  if (data.newDiscovery) {
    return `
      <h4 class="product-new-discovery">New!</h4>
      <div class="product-new-effects">
        ${data.effects.length > 0 ? `This freshly innovated product gives the following bonuses:<br>${templ.effects(data)}` : ''}
      </div>
    `;
  }
  return '';
}

const productPoints = (name, data) => `
  <li>
    <h2>${name.charAt(0).toUpperCase() + name.slice(1)}</h2>
    <ul class="product-points">
      ${_.times(data.levels[name]+1, i => `
        <li class="product-point filled"></li>
      `).join('')}
      ${_.times(10-(data.levels[name]+1), i => `
        <li class="product-point"></li>
      `).join('')}
    </ul>
    <span class="quantity-stat">${Product.levels[name][data.levels[name]].join('-')}</span>
    <div class="product-pointer-control">
      <button data-name="${name}" class="product-point-sub" ${data.levels[name] == 0 ? 'disabled' : ''}>-</button>
      <button data-name="${name}" class="product-point-add" ${data.levels[name] >= 10 || !data.afford[name] ? 'disabled' : ''} data-tip="Next level: ${data.costs[name]} ${Product.requiredSkills[name].join(' & ')}">+</button>
    </div>
  </li>
`;

const template = data => `
<div class="product-designer-view">
  <div class="title">
    <h1>${data.name}</h1>
    <h3 class="subtitle">${data.combo}</h3>
  </div>
  <div class="product-designer-combo">
    ${data.productTypes.map(pt => `
      <img src="assets/productTypes/${util.slugify(pt)}.gif">
    `).join('')}
  </div>
  ${newDiscovery(data)}
  <ul class="product-skills">
    <li>Product points</li>
    <li data-tip="Design"><img src="/assets/company/design.png"> <span class="design-stat">${Math.floor(data.design)}</span></li>
    <li data-tip="Marketing"><img src="/assets/company/marketing.png"> <span class="marketing-stat">${Math.floor(data.marketing)}</span></li>
    <li data-tip="Engineering"><img src="/assets/company/engineering.png"> <span class="engineering-stat">${Math.floor(data.engineering)}</span></li>
  </ul>
  <ul class="product-point-allocator">
    ${productPoints('quantity', data)}
    ${productPoints('strength', data)}
    ${productPoints('movement', data)}
  </ul>
  <div class="actions">
    <button class="launch-product">Launch</button>
  </div>
</div>
`;

class ProductDesigner extends Popup {
  constructor(product) {
    super({
      title: 'Product Designer',
      template: template
    });
    this.product = product;
    this.registerHandlers({
      '.product-point-add': function(ev) {
        var name = $(ev.target).data('name'),
            cost = Product.costs[name](this.product);
        if (this.canAfford(name, cost)) {
          _.each(Product.requiredSkills[name], s => this.product[s] -= cost);
          this.product.levels[name]++;
        }
        this.render();
      },
      '.product-point-sub': function(ev) {
        var name = $(ev.target).data('name'),
            cost;
        this.product.levels[name]--;
        cost = Product.costs[name](this.product);
        _.each(Product.requiredSkills[name], s => this.product[s] += cost);
        this.render();
      },
      '.launch-product': function() {
        // the Manage state hooks into this view's
        // postRemove method to setup the Market
        this.remove();
      }
    });
  }

  canAfford(name, cost) {
    return _.every(Product.requiredSkills[name], s => this.product[s] >= cost);
  }

  render() {
    var self = this;
    super.render(_.extend({
      costs: {
        quantity: Product.costs.quantity(this.product),
        strength: Product.costs.strength(this.product),
        movement: Product.costs.movement(this.product)
      },
      afford: _.reduce(['quantity', 'strength', 'movement'], function(o, n) {
        o[n] = self.canAfford(n, Product.costs[n](self.product));
        return o;
      }, {})
    }, this.product));
    // hack to hide tooltips after re-render
    // otherwise they hang around b/c the element
    // that triggered them disappears
    $('.tooltip').hide();
  }
}

export default ProductDesigner;