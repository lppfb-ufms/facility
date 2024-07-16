package com.facility.dto;

import com.facility.model.Organismo;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

public class OrganismoDTO {

  private Long id;
  private String especie;
  private String origem;
  private String familia;

  List<String> nomePopular;

  public OrganismoDTO(Organismo organismo) {
    this.id = organismo.getId();
    this.especie = organismo.getEspecie();
    this.origem = organismo.getOrigem();
    this.familia = organismo.getFamilia();
    this.nomePopular = organismo
      .getNomePopular()
      .stream()
      .collect(Collectors.toList());
  }

  public OrganismoDTO() {}

  public Organismo toEntity() {
    Organismo organismoEntity = new Organismo();
    organismoEntity.setId(this.getId());
    organismoEntity.setEspecie(this.getEspecie());
    organismoEntity.setOrigem(this.getOrigem());
    organismoEntity.setFamilia(this.getFamilia());
    organismoEntity.setNomePopular(new HashSet<>(this.getNomePopular()));
    return organismoEntity;
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getEspecie() {
    return especie;
  }

  public void setEspecie(String especie) {
    this.especie = especie;
  }

  public String getOrigem() {
    return origem;
  }

  public void setOrigem(String origem) {
    this.origem = origem;
  }

  public String getFamilia() {
    return familia;
  }

  public void setFamilia(String familia) {
    this.familia = familia;
  }

  public List<String> getNomePopular() {
    return nomePopular;
  }

  public void setNomePopular(List<String> nomePopular) {
    this.nomePopular = nomePopular;
  }
}
